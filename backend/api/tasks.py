from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from core.models import Task, TaskComment, TaskAttachment, Project
from .serializers import TaskSerializer, TaskCommentSerializer, TaskAttachmentSerializer
import json
from core.models import AnalyticsEvent
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Filter tasks by user access"""
        user = self.request.user
        qs = Task.objects.filter(
            Q(assignee=user) | Q(created_by=user) | Q(project__members__user=user)
        ).distinct()

        # Apply filters from query params
        params = self.request.query_params
        status_param = params.get('status')
        priority_param = params.get('priority')
        assignee_param = params.get('assignee')
        project_param = params.get('project')
        search_param = params.get('search')

        if status_param:
            qs = qs.filter(status=status_param)
        if priority_param:
            qs = qs.filter(priority=priority_param)
        if assignee_param:
            try:
                qs = qs.filter(assignee_id=int(assignee_param))
            except ValueError:
                pass
        if project_param:
            try:
                qs = qs.filter(project_id=int(project_param))
            except ValueError:
                pass
        if search_param:
            qs = qs.filter(Q(title__icontains=search_param) | Q(description__icontains=search_param))

        ordering = params.get('ordering')
        if ordering in ['due_date', '-due_date', 'priority', '-priority', 'created_at', '-created_at']:
            qs = qs.order_by(ordering)

        return qs

    def perform_create(self, serializer):
        """Only Scrum Masters can create tasks; set creator and validate assignment."""
        if not hasattr(self.request.user, 'role') or self.request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can create tasks'}, status=status.HTTP_403_FORBIDDEN)
        
        # Validate assignee if provided
        assignee = serializer.validated_data.get('assignee')
        project = serializer.validated_data.get('project')
        if assignee and project and not project.can_assign_tasks_to(assignee):
            from django.core.exceptions import ValidationError
            raise ValidationError({
                'assignee': f'User {assignee.username} is not a member of project {project.name}. Only project members can be assigned tasks.'
            })
        
        task = serializer.save(created_by=self.request.user)
        # Emit analytics event
        try:
            AnalyticsEvent.objects.create(
                user=self.request.user,
                event_type='task_created',
                entity_type='task',
                entity_id=task.id,
                metadata={'priority': task.priority, 'project_id': task.project_id}
            )
        except Exception:
            pass

    def create(self, request, *args, **kwargs):
        """Validate role before creating."""
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can create tasks'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Allow partial update via PUT/PATCH; restrict fields for employees to only own tasks."""
        kwargs['partial'] = True
        task = self.get_object()
        user = request.user
        # Employees can only update limited fields on their own tasks
        if hasattr(user, 'role') and user.role == 'employee':
            if task.assignee_id != user.id:
                return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
            # Filter payload to allowed fields
            allowed_fields = {'status'}
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            request._full_data = data
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for a specific task"""
        task = self.get_object()
        comments = task.comments.all().order_by('-created_at')
        return Response(TaskCommentSerializer(comments, many=True).data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a task"""
        task = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({
                'error': 'Content is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        comment = TaskComment.objects.create(
            task=task,
            user=request.user,
            content=content
        )

        return Response(TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        """Get attachments for a specific task"""
        task = self.get_object()
        attachments = task.attachments.all().order_by('-uploaded_at')
        return Response(TaskAttachmentSerializer(attachments, many=True).data)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        """Upload an attachment to a task"""
        task = self.get_object()
        file = request.FILES.get('file')
        
        if not file:
            return Response({
                'error': 'File is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        attachment = TaskAttachment.objects.create(
            task=task,
            file=file,
            uploaded_by=request.user,
            filename=file.name
        )

        return Response(TaskAttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign a task to a user"""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'error': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Only Scrum Masters can assign tasks
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can assign tasks'}, status=status.HTTP_403_FORBIDDEN)

        try:
            from core.models import User
            user = User.objects.get(id=user_id)
            
            # Validate that the user is a member of the project
            if not task.project.can_assign_tasks_to(user):
                return Response({
                    'error': f'User {user.username} is not a member of project {task.project.name}. Only project members can be assigned tasks.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            task.assignee = user
            task.save()
            return Response(TaskSerializer(task).data)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def unassign(self, request, pk=None):
        """Unassign a task"""
        task = self.get_object()
        # Only Scrum Masters can unassign tasks
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can unassign tasks'}, status=status.HTTP_403_FORBIDDEN)
        task.assignee = None
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change task status"""
        task = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({
                'error': 'status is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = ['todo', 'in-progress', 'review', 'done']
        if new_status not in valid_statuses:
            return Response({
                'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Scrum Master can change any, employee only their own
        if hasattr(request.user, 'role') and request.user.role == 'employee' and task.assignee_id != request.user.id:
            return Response({'error': 'Employees can only change status on their assigned tasks'}, status=status.HTTP_403_FORBIDDEN)
        task.status = new_status
        task.save()
        # Emit analytics event
        try:
            AnalyticsEvent.objects.create(
                user=request.user,
                event_type='task_moved' if new_status != 'done' else 'task_completed',
                entity_type='task',
                entity_id=task.id,
                metadata={'to_status': new_status}
            )
        except Exception:
            pass
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def change_priority(self, request, pk=None):
        """Change task priority"""
        task = self.get_object()
        new_priority = request.data.get('priority')
        
        if not new_priority:
            return Response({
                'error': 'priority is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if new_priority not in valid_priorities:
            return Response({
                'error': f'Invalid priority. Must be one of: {", ".join(valid_priorities)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Only Scrum Masters can change priority
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can change priority'}, status=status.HTTP_403_FORBIDDEN)
        task.priority = new_priority
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to the current user"""
        user = request.user
        tasks = Task.objects.filter(assignee=user).order_by('-created_at')
        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def created_by_me(self, request):
        """Get tasks created by the current user"""
        user = request.user
        tasks = Task.objects.filter(created_by=user).order_by('-created_at')
        return Response(TaskSerializer(tasks, many=True).data)
