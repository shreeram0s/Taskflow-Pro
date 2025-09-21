from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.models import User, Project, Task, ProjectMember, TaskComment, TaskAttachment, Notification, AnalyticsEvent
from core.validators import validate_password_strength

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 
            'profile_picture', 'date_joined', 'last_active', 'bio', 
            'job_title', 'department', 'phone', 'password', 'confirm_password'
        ]
        read_only_fields = ['id', 'date_joined', 'last_active']
    
    def validate_password(self, value):
        """Validate password strength"""
        # Basic validation to ensure password meets minimum requirements
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        return value
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if value:
            value = value.lower()
            # For new users (self.instance is None), check if email exists
            # For existing users, exclude their own email from the check
            if User.objects.filter(email=value).exclude(pk=self.instance.pk if self.instance else None).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate username format and uniqueness"""
        if value:
            if User.objects.filter(username=value).exclude(pk=self.instance.pk if self.instance else None).exists():
                raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        if 'password' in attrs and 'confirm_password' in attrs:
            if attrs['password'] != attrs['confirm_password']:
                raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs
        
class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='employee')
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    username = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'role', 'first_name', 'last_name']
        
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
        
    def validate_username(self, value):
        """Validate username uniqueness"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
        
    def validate_password(self, value):
        """Validate password strength"""
        # Basic validation to ensure password meets minimum requirements
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        return value
        
    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs
        
    def create(self, validated_data):
        """Create a new user with encrypted password"""
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'employee'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
        
class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'bio', 'profile_picture', 'job_title', 'department', 'phone',
            'date_joined', 'last_active', 'is_active'
        ]
        read_only_fields = ['id', 'username', 'email', 'date_joined', 'last_active', 'role']

    def validate(self, attrs):
        if attrs.get('password') and attrs.get('confirm_password'):
            if attrs['password'] != attrs['confirm_password']:
                raise serializers.ValidationError("Passwords do not match.")
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        
        # Ensure role is properly set
        role = validated_data.get('role', 'employee')
        print(f"Creating user with role: {role}")
        
        # Create user with all data including role
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        
        # Explicitly set role to ensure it's saved
        user.role = role
        print(f"Explicitly setting user role to {role}")
            
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update user, handling password separately"""
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
            instance.last_password_change = timezone.now()
        
        instance.save()
        return instance

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates (without password)"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'profile_picture', 'bio', 'job_title', 'department', 'phone',
            'theme_preference', 'notification_preferences'
        ]
        read_only_fields = ['id', 'role', 'username']
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if value:
            value = value.lower()
            if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password_strength(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs
    
    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists"""
        if not User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value.lower()

class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password_strength(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs
    
    def validate_token(self, value):
        """Validate reset token"""
        try:
            user = User.objects.get(password_reset_token=value)
            if not user.is_password_reset_token_valid():
                raise serializers.ValidationError("Password reset token has expired.")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid password reset token.")
        return value

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']

class ProjectSerializer(serializers.ModelSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    task_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date', 'status',
            'created_by', 'members', 'created_at', 'updated_at',
            'task_count', 'member_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'task_count', 'member_count']

    def get_task_count(self, obj):
        return getattr(obj, 'task_count', None) or obj.tasks.count()

    def get_member_count(self, obj):
        return getattr(obj, 'member_count', None) or obj.members.count()

class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'due_date',
            'assignee', 'assignee_id', 'created_by', 'project', 'comment_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_comment_count(self, obj):
        return obj.comments.count()

    def validate_title(self, value: str):
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters long')
        return value.strip()

    def validate_due_date(self, value):
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError('Due date cannot be in the past')
        return value

    def create(self, validated_data):
        # Resolve project from context (set by the view) and optional assignee
        project = self.context.get('project')
        request = self.context.get('request')
        assignee_id = validated_data.pop('assignee_id', None)

        task_kwargs = {
            **validated_data,
            'project': project,
            'created_by': getattr(request, 'user', None),
        }

        if assignee_id is not None:
            from core.models import User, ProjectMember
            try:
                assignee = User.objects.get(id=assignee_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({'assignee_id': 'Assignee not found'})
            # Ensure assignee is a member of the project
            if project and not ProjectMember.objects.filter(project=project, user=assignee).exists():
                raise serializers.ValidationError({'assignee_id': 'Assignee must be a member of the project'})
            task_kwargs['assignee'] = assignee

        return Task.objects.create(**task_kwargs)

class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'content', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = ['id', 'file', 'filename', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsEvent
        fields = ['id', 'event_type', 'entity_type', 'entity_id', 'metadata', 'ip_address', 'user_agent', 'timestamp']
        read_only_fields = ['id', 'timestamp']
