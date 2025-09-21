import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class PasswordValidator:
    """Custom password validator with comprehensive security checks"""
    
    def __init__(self, min_length=8, require_uppercase=True, require_lowercase=True, 
                 require_digits=True, require_special_chars=True):
        self.min_length = min_length
        self.require_uppercase = require_uppercase
        self.require_lowercase = require_lowercase
        self.require_digits = require_digits
        self.require_special_chars = require_special_chars
    
    def validate(self, password, user=None):
        """Validate password strength"""
        errors = []
        
        if len(password) < self.min_length:
            errors.append(
                ValidationError(
                    _("Password must be at least %(min_length)d characters long."),
                    code='password_too_short',
                    params={'min_length': self.min_length},
                )
            )
        
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one uppercase letter."),
                    code='password_no_upper',
                )
            )
        
        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one lowercase letter."),
                    code='password_no_lower',
                )
            )
        
        if self.require_digits and not re.search(r'\d', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one digit."),
                    code='password_no_digit',
                )
            )
        
        if self.require_special_chars and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one special character."),
                    code='password_no_special',
                )
            )
        
        # Check for common weak patterns
        if self._is_common_password(password):
            errors.append(
                ValidationError(
                    _("This password is too common. Please choose a stronger password."),
                    code='password_too_common',
                )
            )
        
        if errors:
            raise ValidationError(errors)
    
    def _is_common_password(self, password):
        """Check if password is in common passwords list"""
        common_passwords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
        ]
        return password.lower() in common_passwords
    
    def get_help_text(self):
        """Return help text for password requirements"""
        requirements = [f"At least {self.min_length} characters"]
        
        if self.require_uppercase:
            requirements.append("one uppercase letter")
        if self.require_lowercase:
            requirements.append("one lowercase letter")
        if self.require_digits:
            requirements.append("one digit")
        if self.require_special_chars:
            requirements.append("one special character")
        
        return "Password must contain: " + ", ".join(requirements) + "."


def validate_password_strength(password):
    """Validate password strength using the custom validator"""
    validator = PasswordValidator()
    validator.validate(password)
