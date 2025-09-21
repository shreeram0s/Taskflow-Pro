from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import users, projects, tasks, events

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', users.UserViewSet, basename='user')
router.register(r'projects', projects.ProjectViewSet, basename='project')
router.register(r'tasks', tasks.TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    # Events endpoints
    path('events/', events.create_event, name='create_event'),
    path('events/list/', events.get_events, name='get_events'),
    path('events/dashboard/', events.get_dashboard_analytics, name='get_dashboard_analytics'),
    path('events/task-analytics/', events.get_task_analytics, name='get_task_analytics'),
    # Analytics endpoints
    path('analytics/dashboard/', events.get_dashboard_analytics, name='analytics_dashboard'),
    path('analytics/task/completion/', events.get_task_analytics, name='analytics_task_completion'),
    path('analytics/user/', events.get_dashboard_analytics, name='analytics_user'),
    path('analytics/user/productivity/', events.get_dashboard_analytics, name='analytics_user_productivity'),
    path('analytics/project/<int:project_id>/', events.get_dashboard_analytics, name='analytics_project'),
    path('analytics/log/', events.create_event, name='analytics_log'),
    # Token endpoints for authentication
    path('token/', users.UserViewSet.as_view({'post': 'login'}), name='token_obtain_pair'),
    path('token/refresh/', users.UserViewSet.as_view({'post': 'refresh'}), name='token_refresh'),
    # User authentication endpoints
    path('users/login/', users.UserViewSet.as_view({'post': 'login'}), name='user_login'),
    path('users/register/', users.UserViewSet.as_view({'post': 'register'}), name='user_register'),
    path('users/refresh/', users.UserViewSet.as_view({'post': 'refresh'}), name='user_refresh'),
]