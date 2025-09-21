from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from core.models import Project, ProjectMember, User, Task
from .serializers import ProjectSerializer, ProjectMemberSerializer
import json
from core.models import AnalyticsEvent

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter projects by user membership and role
        - Scrum Masters can see all projects they created or are members of
        - Employees can only see projects they are assigned to as members
        """
        user = self.request.user
        
        # For employees, only show projects they're assigned to
        if hasattr(user, 'role') and user.role == 'employee':
            return Project.objects.filter(members__user=user).distinct()
        
        # For scrum masters and other roles, show all relevant projects
        return Project.objects.filter(
            Q(created_by=user) | Q(members__user=user)
        ).distinct()

    def perform_create(self, serializer):
        """Only Scrum Masters or superusers can create projects; set the creator and add as member."""
        user = self.request.user
        if not (getattr(user, 'role', None) == 'scrum_master' or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('Only Scrum Masters can create projects')
        project = serializer.save(created_by=user)
        
        # Automatically add the creator as an admin member
        project.add_creator_as_member()
        
        # Emit analytics event
        try:
            AnalyticsEvent.objects.create(
                user=user,
                event_type='project_created',
                entity_type='project',
                entity_id=project.id,
                metadata={'name': project.name}
            )
        except Exception:
            pass

    def create(self, request, *args, **kwargs):
        user = request.user
        if not (getattr(user, 'role', None) == 'scrum_master' or getattr(user, 'is_superuser', False)):
            return Response({'error': 'Only Scrum Masters can create projects'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['get', 'post'])
    def tasks(self, request, pk=None):
        """Get or create tasks for a specific project.
        GET: list tasks; POST: create task (Scrum Master only).
        """
        project = self.get_object()
        from .serializers import TaskSerializer
        if request.method.lower() == 'get':
            tasks = project.tasks.all()
            return Response(TaskSerializer(tasks, many=True).data)
        # POST create
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can create tasks'}, status=status.HTTP_403_FORBIDDEN)
        serializer = TaskSerializer(data=request.data, context={'project': project, 'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        task = serializer.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def members(self, request, pk=None):
        """Add a member to the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'error': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if user is already a member
        if ProjectMember.objects.filter(project=project, user=user).exists():
            return Response({
                'error': 'User is already a member of this project'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Only Scrum Masters can add members
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can add members'}, status=status.HTTP_403_FORBIDDEN)

        member = ProjectMember.objects.create(
            project=project,
            user=user,
            role=request.data.get('role', 'member')
        )

        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        """Remove a member from the project"""
        project = self.get_object()
        if not hasattr(request.user, 'role') or request.user.role != 'scrum_master':
            return Response({'error': 'Only Scrum Masters can remove members'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.delete()
            return Response({'message': 'Member removed successfully'})
        except ProjectMember.DoesNotExist:
            return Response({
                'error': 'Member not found'
            }, status=status.HTTP_404_NOT_FOUND)

    # Removed duplicate tasks action (consolidated above)

    @action(detail=True, methods=['get'])
    def members_list(self, request, pk=None):
        """Get all members of the project"""
        project = self.get_object()
        members = ProjectMember.objects.filter(project=project)
        return Response(ProjectMemberSerializer(members, many=True).data)
    
    @action(detail=True, methods=['get'])
    def assignable_users(self, request, pk=None):
        """Get all users who can be assigned tasks for this project (project members)"""
        project = self.get_object()
        members = ProjectMember.objects.filter(project=project).select_related('user')
        
        # Return user data for task assignment
        assignable_users = []
        for member in members:
            assignable_users.append({
                'id': member.user.id,
                'username': member.user.username,
                'first_name': member.user.first_name,
                'last_name': member.user.last_name,
                'email': member.user.email,
                'role': member.user.role,
                'member_role': member.role,
                'joined_at': member.joined_at
            })
        
        return Response(assignable_users)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get project analytics"""
        project = self.get_object()
        
        # Basic project statistics
        total_tasks = project.tasks.count()
        completed_tasks = project.tasks.filter(status='done').count()
        in_progress_tasks = project.tasks.filter(status='in-progress').count()
        todo_tasks = project.tasks.filter(status='todo').count()
        
        # Calculate progress percentage
        progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return Response({
            'project_id': project.id,
            'project_name': project.name,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'todo_tasks': todo_tasks,
            'progress_percentage': round(progress, 2),
            'members_count': project.members.count()
        })
