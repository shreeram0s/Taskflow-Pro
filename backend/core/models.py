from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import RegexValidator, MinLengthValidator
from django.contrib.auth.validators import UnicodeUsernameValidator
import uuid

class User(AbstractUser):
    """Extended user model with additional fields and security features"""
    ROLE_CHOICES = [
        ('scrum_master', 'Scrum Master'),
        ('employee', 'Employee'),
    ]
    
    # Core user fields
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[username_validator],
        error_messages={'unique': 'A user with that username already exists.'},
    )
    email = models.EmailField(unique=True, error_messages={'unique': 'A user with that email already exists.'})
    
    # Profile fields
    bio = models.TextField(blank=True, max_length=500)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(
        max_length=20, 
        blank=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    
    # Security and preferences
    theme_preference = models.CharField(max_length=20, default='light')
    notification_preferences = models.JSONField(default=dict)
    last_active = models.DateTimeField(default=timezone.now)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    
    # Security fields
    email_verified = models.BooleanField(default=False)
    password_reset_token = models.UUIDField(default=uuid.uuid4, editable=False)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True)
    
    # Account status
    is_active = models.BooleanField(default=True)
    account_locked = models.BooleanField(default=False)
    last_password_change = models.DateTimeField(default=timezone.now)
    
    # Fix for reverse accessor clash
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='core_user_set',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='core_user_set',
        related_query_name='user',
    )
    
    def __str__(self):
        return self.username
    
    def is_scrum_master(self):
        """Check if user is a Scrum Master"""
        return self.role == 'scrum_master'
    
    def is_employee(self):
        """Check if user is an Employee"""
        return self.role == 'employee'
    
    def can_create_projects(self):
        """Check if user can create projects (Scrum Masters only)"""
        return self.is_scrum_master()
    
    def can_assign_tasks(self):
        """Check if user can assign tasks (Scrum Masters only)"""
        return self.is_scrum_master()
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked:
            return True
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False
    
    def lock_account(self, duration_minutes=30):
        """Lock account for specified duration"""
        self.account_locked = True
        self.locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        self.save()
    
    def unlock_account(self):
        """Unlock account and reset failed attempts"""
        self.account_locked = False
        self.locked_until = None
        self.failed_login_attempts = 0
        self.save()
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock if threshold reached"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:  # Lock after 5 failed attempts
            self.lock_account()
        self.save()
    
    def reset_failed_login_attempts(self):
        """Reset failed login attempts on successful login"""
        self.failed_login_attempts = 0
        self.save()
    
    def update_last_active(self):
        """Update last active timestamp"""
        self.last_active = timezone.now()
        self.save(update_fields=['last_active'])
    
    def set_password_reset_token(self):
        """Generate new password reset token"""
        self.password_reset_token = uuid.uuid4()
        self.password_reset_expires = timezone.now() + timezone.timedelta(hours=1)
        self.save()
    
    def is_password_reset_token_valid(self):
        """Check if password reset token is valid and not expired"""
        if not self.password_reset_expires:
            return False
        return timezone.now() < self.password_reset_expires
    
    def clean(self):
        """Custom validation"""
        super().clean()
        if self.email:
            self.email = self.email.lower()
    
    def save(self, *args, **kwargs):
        """Override save to ensure email is lowercase"""
        self.clean()
        super().save(*args, **kwargs)

class Project(models.Model):
    """Project model"""
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('in-progress', 'In Progress'),
        ('review', 'Review'),
        ('completed', 'Completed'),
        ('on-hold', 'On Hold'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def progress(self):
        """Calculate project progress based on completed tasks"""
        tasks = self.tasks.all()
        if not tasks:
            return 0
        
        completed_tasks = tasks.filter(status='done').count()
        return int((completed_tasks / tasks.count()) * 100)
    
    def add_creator_as_member(self):
        """Automatically add the project creator as an admin member"""
        if not ProjectMember.objects.filter(project=self, user=self.created_by).exists():
            ProjectMember.objects.create(
                project=self,
                user=self.created_by,
                role='admin'
            )
    
    def get_members(self):
        """Get all project members including the creator"""
        return self.members.select_related('user').all()
    
    def is_member(self, user):
        """Check if a user is a member of this project"""
        return ProjectMember.objects.filter(project=self, user=user).exists()
    
    def can_assign_tasks_to(self, user):
        """Check if tasks can be assigned to a specific user (must be a project member)"""
        return self.is_member(user)

class ProjectMember(models.Model):
    """Project member model"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('viewer', 'Viewer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'project')
    
    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({self.role})"

class Task(models.Model):
    """Task model"""
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in-progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.title
    
    def clean(self):
        """Validate task assignment - assignee must be a project member"""
        super().clean()
        if self.assignee and self.project:
            if not self.project.can_assign_tasks_to(self.assignee):
                from django.core.exceptions import ValidationError
                raise ValidationError({
                    'assignee': f'User {self.assignee.username} is not a member of project {self.project.name}. Only project members can be assigned tasks.'
                })
    
    def save(self, *args, **kwargs):
        # Validate assignment before saving
        self.clean()
        
        # Set completed_at when status changes to 'done'
        if self.status == 'done' and not self.completed_at:
            self.completed_at = timezone.now()
        # Clear completed_at when status changes from 'done'
        elif self.status != 'done' and self.completed_at:
            self.completed_at = None
        
        super().save(*args, **kwargs)

class TaskComment(models.Model):
    """Task comment model"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Comment on {self.task.title} by {self.user.username}"

class TaskAttachment(models.Model):
    """Task attachment model"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to='task_attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.filename

class ActivityLog(models.Model):
    """Activity log model for tracking user actions"""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('comment', 'Comment'),
        ('status_change', 'Status Change'),
        ('assignment', 'Assignment'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    ENTITY_CHOICES = [
        ('project', 'Project'),
        ('task', 'Task'),
        ('user', 'User'),
        ('comment', 'Comment'),
        ('attachment', 'Attachment'),
        ('system', 'System'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=20, choices=ENTITY_CHOICES)
    entity_id = models.IntegerField()
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} {self.action} {self.entity_type} at {self.timestamp}"

class BehavioralAnalytics(models.Model):
    """Behavioral analytics model for tracking user behavior"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics')
    session_id = models.CharField(max_length=100)
    page_visited = models.CharField(max_length=255)
    time_spent = models.IntegerField(help_text='Time spent in seconds')
    actions_performed = models.JSONField(default=list)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} visited {self.page_visited} for {self.time_spent}s"

class Notification(models.Model):
    """Notification model"""
    TYPE_CHOICES = [
        ('task_assigned', 'Task Assigned'),
        ('task_updated', 'Task Updated'),
        ('task_commented', 'Task Commented'),
        ('project_updated', 'Project Updated'),
        ('mention', 'Mention'),
        ('due_date', 'Due Date Reminder'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} for {self.user.username}"

class AnalyticsEvent(models.Model):
    """Analytics event model for tracking user actions"""
    EVENT_TYPES = [
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_moved', 'Task Moved'),
        ('task_completed', 'Task Completed'),
        ('task_assigned', 'Task Assigned'),
        ('project_created', 'Project Created'),
        ('project_updated', 'Project Updated'),
        ('comment_added', 'Comment Added'),
        ('file_uploaded', 'File Uploaded'),
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    entity_type = models.CharField(max_length=20)  # 'task', 'project', 'comment', etc.
    entity_id = models.IntegerField()
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'event_type']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.event_type} at {self.timestamp}"