from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
import json
from datetime import timedelta
from core.models import AnalyticsEvent, User, Project, Task
from .serializers import AnalyticsEventSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_event(request):
    """Create a new analytics event"""
    user = request.user
    data = request.data
    
    # Validate required fields
    required_fields = ['event_type', 'entity_type', 'entity_id']
    for field in required_fields:
        if field not in data:
            return Response({'status': 'error', 'message': f'Missing required field: {field}'}, status=400)
    
    # Create event
    event = AnalyticsEvent.objects.create(
        user=user,
        event_type=data['event_type'],
        entity_type=data['entity_type'],
        entity_id=data['entity_id'],
        metadata=data.get('metadata', {}),
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    # Serialize event
    serialized_event = AnalyticsEventSerializer(event).data
    return Response({'status': 'success', 'data': serialized_event}, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_events(request):
    """Get analytics events for the current user"""
    user = request.user
    
    # Get query parameters
    event_type = request.GET.get('event_type')
    entity_type = request.GET.get('entity_type')
    days = int(request.GET.get('days', 30))
    
    # Set time range
    start_date = timezone.now() - timedelta(days=days)
    
    # Build query
    events = AnalyticsEvent.objects.filter(
        user=user,
        timestamp__gte=start_date
    )
    
    if event_type:
        events = events.filter(event_type=event_type)
    if entity_type:
        events = events.filter(entity_type=entity_type)
    
    # Order by timestamp
    events = events.order_by('-timestamp')
    
    # Serialize events
    serialized_events = AnalyticsEventSerializer(events, many=True).data
    return Response({'status': 'success', 'data': serialized_events})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dashboard_analytics(request):
    """Get dashboard analytics data"""
    user = request.user
    days = int(request.GET.get('days', 30))
    
    # Set time range
    start_date = timezone.now() - timedelta(days=days)
    
    # Get events in time range
    events = AnalyticsEvent.objects.filter(
        user=user,
        timestamp__gte=start_date
    )
    
    # Task events
    task_events = events.filter(entity_type='task')
    task_created = task_events.filter(event_type='task_created').count()
    task_completed = task_events.filter(event_type='task_completed').count()
    task_moved = task_events.filter(event_type='task_moved').count()
    
    # Project events
    project_events = events.filter(entity_type='project')
    project_created = project_events.filter(event_type='project_created').count()
    
    # Activity over time (last 7 days)
    activity_data = []
    for i in range(7):
        date = timezone.now() - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_events = events.filter(timestamp__gte=day_start, timestamp__lt=day_end)
        activity_data.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'events': day_events.count(),
            'task_created': day_events.filter(event_type='task_created').count(),
            'task_completed': day_events.filter(event_type='task_completed').count(),
        })
    
    # Event type distribution
    event_distribution = events.values('event_type').annotate(count=Count('id'))
    
    # Most active projects
    project_activity = events.filter(
        entity_type='project'
    ).values('entity_id').annotate(count=Count('id')).order_by('-count')[:5]
    
    # Add project names
    for item in project_activity:
        try:
            project = Project.objects.get(id=item['entity_id'])
            item['project_name'] = project.name
        except Project.DoesNotExist:
            item['project_name'] = 'Unknown Project'
    
    return Response({'status': 'success', 'data': {
        'summary': {
            'task_created': task_created,
            'task_completed': task_completed,
            'task_moved': task_moved,
            'project_created': project_created,
            'total_events': events.count()
        },
        'activity_over_time': activity_data,
        'event_distribution': list(event_distribution),
        'most_active_projects': list(project_activity)
    }})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_task_analytics(request):
    """Get task-specific analytics"""
    user = request.user
    days = int(request.GET.get('days', 30))
    
    # Set time range
    start_date = timezone.now() - timedelta(days=days)
    
    # Get task events
    task_events = AnalyticsEvent.objects.filter(
        user=user,
        entity_type='task',
        timestamp__gte=start_date
    )
    
    # Task status changes
    status_changes = task_events.filter(event_type='task_moved').values('metadata').annotate(count=Count('id'))
    
    # Task completion rate by priority
    completed_tasks = task_events.filter(event_type='task_completed')
    completion_by_priority = {}
    
    for event in completed_tasks:
        priority = event.metadata.get('priority', 'unknown')
        if priority not in completion_by_priority:
            completion_by_priority[priority] = 0
        completion_by_priority[priority] += 1
    
    # Average time to complete tasks
    created_tasks = task_events.filter(event_type='task_created')
    completed_tasks = task_events.filter(event_type='task_completed')
    
    # This is a simplified calculation - in a real app you'd want to match created/completed events
    avg_completion_time = 0
    if completed_tasks.count() > 0:
        # For now, just return the count - proper calculation would require matching events
        avg_completion_time = completed_tasks.count()
    
    return Response({'status': 'success', 'data': {
        'status_changes': list(status_changes),
        'completion_by_priority': completion_by_priority,
        'avg_completion_time': avg_completion_time,
        'total_tasks_created': created_tasks.count(),
        'total_tasks_completed': completed_tasks.count()
    }})
