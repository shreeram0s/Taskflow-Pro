from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from core.models import User as CustomUser, Notification
from .serializers import (
    UserSerializer, UserProfileSerializer, PasswordChangeSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer, NotificationSerializer,
    RegisterSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
import json
from django.contrib.auth.hashers import check_password
import logging

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['login', 'refresh', 'register']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        # Log the incoming request data for debugging
        logger.info(f"Registration request data: {request.data}")
        
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error during user registration: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f"Registration validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Enhanced login with security features"""
        username = request.data.get('username')
        password = request.data.get('password')
        ip_address = self.get_client_ip(request)

        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Try to find user by username or email
            user = CustomUser.objects.filter(
                Q(username=username) | Q(email=username)
            ).first()
            
            if not user:
                logger.warning(f"Login attempt with non-existent username/email: {username} from IP: {ip_address}")
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if account is locked
            if user.is_account_locked():
                logger.warning(f"Login attempt on locked account: {username} from IP: {ip_address}")
                return Response({
                    'error': 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
                }, status=status.HTTP_423_LOCKED)
            
            # Check if account is active
            if not user.is_active:
                logger.warning(f"Login attempt on inactive account: {username} from IP: {ip_address}")
                return Response({
                    'error': 'Account is deactivated. Please contact support.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Authenticate user
            authenticated_user = authenticate(username=user.username, password=password)
            if not authenticated_user:
                # Increment failed login attempts
                user.increment_failed_login()
                logger.warning(f"Failed login attempt for user: {username} from IP: {ip_address}")
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Reset failed login attempts on successful login
            user.reset_failed_login_attempts()
            user.update_last_active()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Log successful login
            logger.info(f"Successful login for user: {username} from IP: {ip_address}")
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            })
            
        except Exception as e:
            logger.error(f"Login error for username: {username}, error: {str(e)}")
            return Response({
                'error': 'An error occurred during login. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def refresh(self, request):
        """Refresh JWT token"""
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token)
            })
        except Exception as e:
            return Response({
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Enhanced user registration with comprehensive validation"""
        data = request.data.copy()
        
        # Log the incoming registration data (excluding sensitive fields)
        safe_data = {k: v for k, v in data.items() if k not in ['password', 'confirm_password']}
        logger.info(f"Registration attempt with data: {safe_data}")
        
        # Validate role and ensure it's properly handled
        role = data.get('role', 'employee')
        logger.info(f"Registration role: {role}")
        
        if role not in ['employee', 'scrum_master']:
            return Response({
                'error': 'Invalid role specified',
                'details': {'role': ['Role must be either "employee" or "scrum_master"']}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate password confirmation
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        if password != confirm_password:
            return Response({
                'error': 'Passwords do not match',
                'details': {'confirm_password': ['Passwords do not match']}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Ensure role is explicitly set in the data
        data['role'] = role
        
        # Make sure username is properly set
        if 'email' in data and not data.get('username'):
            data['username'] = data['email']
            
        serializer = UserSerializer(data=data)
        
        if not serializer.is_valid():
            logger.warning(f"Registration validation failed: {serializer.errors}")
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create user
            user = serializer.save()
            
            # Set email_verified to True for now (in production, would send verification email)
            user.email_verified = True
            user.is_active = True
            user.save()
            
            # Log successful registration
            logger.info(f"New user registered: {user.username} with role: {user.role}")
            
            # Send welcome email (optional)
            try:
                self.send_welcome_email(user)
            except Exception as e:
                logger.warning(f"Failed to send welcome email to {user.email}: {str(e)}")
            
            # Generate tokens for immediate login
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User created successfully',
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response({
                'error': 'An error occurred during registration. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_welcome_email(self, user):
        """Send welcome email to new user"""
        if not settings.EMAIL_HOST_USER:
            return
        
        subject = 'Welcome to TaskFlow!'
        message = f"""
        Hello {user.first_name},
        
        Welcome to TaskFlow! Your account has been successfully created.
        
        Username: {user.username}
        Role: {user.get_role_display()}
        
        You can now log in to your account and start managing your projects and tasks.
        
        Best regards,
        The TaskFlow Team
        """
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=True,
        )

    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        return Response(UserProfileSerializer(request.user).data)

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update current user profile with validation"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = serializer.save()
            logger.info(f"Profile updated for user: {user.username}")
            return Response(UserProfileSerializer(user).data)
            
        except Exception as e:
            logger.error(f"Profile update error for user {request.user.username}: {str(e)}")
            return Response({
                'error': 'An error occurred while updating profile. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='change_password')
    def change_password(self, request):
        """Change password for current user with enhanced security"""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = request.user
            new_password = serializer.validated_data['new_password']
            
            # Set new password
            user.set_password(new_password)
            user.last_password_change = timezone.now()
            user.save()
            
            # Log password change
            logger.info(f"Password changed for user: {user.username}")
            
            return Response({'message': 'Password changed successfully'})
            
        except Exception as e:
            logger.error(f"Password change error for user {request.user.username}: {str(e)}")
            return Response({
                'error': 'An error occurred while changing password. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password_reset')
    def password_reset(self, request):
        """Request password reset"""
        serializer = PasswordResetSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            email = serializer.validated_data['email']
            user = CustomUser.objects.get(email=email)
            
            # Generate reset token
            user.set_password_reset_token()
            
            # Send reset email
            self.send_password_reset_email(user)
            
            logger.info(f"Password reset requested for user: {user.username}")
            
            return Response({
                'message': 'Password reset email sent successfully'
            })
            
        except CustomUser.DoesNotExist:
            return Response({
                'error': 'No user found with this email address'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}")
            return Response({
                'error': 'An error occurred while processing password reset. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password_reset_confirm')
    def password_reset_confirm(self, request):
        """Confirm password reset with token"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            user = CustomUser.objects.get(password_reset_token=token)
            user.set_password(new_password)
            user.password_reset_token = None
            user.password_reset_expires = None
            user.last_password_change = timezone.now()
            user.save()
            
            logger.info(f"Password reset completed for user: {user.username}")
            
            return Response({
                'message': 'Password reset successfully. You can now log in with your new password.'
            })
            
        except CustomUser.DoesNotExist:
            return Response({
                'error': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Password reset confirm error: {str(e)}")
            return Response({
                'error': 'An error occurred while resetting password. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_password_reset_email(self, user):
        """Send password reset email"""
        if not settings.EMAIL_HOST_USER:
            return
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={user.password_reset_token}"
        
        subject = 'TaskFlow - Password Reset Request'
        message = f"""
        Hello {user.first_name},
        
        You have requested to reset your password for your TaskFlow account.
        
        To reset your password, click the link below:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        The TaskFlow Team
        """
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=True,
        )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users by username or name"""
        query = request.GET.get('q', '')
        if not query:
            return Response([])

        users = CustomUser.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:10]

        return Response(UserSerializer(users, many=True).data)

    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """Get user notifications"""
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        return Response(NotificationSerializer(notifications, many=True).data)

    @action(detail=False, methods=['post'])
    def mark_notification_read(self, request):
        """Mark a notification as read"""
        notification_id = request.data.get('notification_id')
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def activity(self, request):
        """Get user activity logs"""
        # This would typically come from an ActivityLog model
        return Response({
            'message': 'Activity logs feature coming soon',
            'activities': []
        })
