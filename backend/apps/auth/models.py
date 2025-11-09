from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from datetime import timedelta
import secrets

# ----------------------------
# 1️⃣ USER & ORGANIZER MODEL
# ----------------------------

class UserRole(models.TextChoices):
    GUEST = 'guest'
    ORGANIZER = 'organizer'
    TEAM = 'team'



class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.GUEST)
        return self.create_user(email, password, **extra_fields)



class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.GUEST,
    )

    profile_picture = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        help_text="User's profile picture stored on S3."
    )

    banner_media = models.FileField(
        upload_to='banners/',
        blank=True,
        null=True,
        help_text=(
            "User's banner image or video (supports both). "
            "Storage: Local filesystem in development (MEDIA_ROOT/banners/), "
            "S3 in production when USE_S3=True (uses backend.storages.MediaStorage). "
            "Supports .jpg, .png, .gif, .mp4, .webm, .mov formats."
        )
    )

    name = models.CharField(max_length=100, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True, help_text="User's date of birth")

    # Organizer-specific fields (nullable for non-organizers)
    organizer_bio = models.TextField(blank=True, null=True, help_text="Bio for organizer accounts")

    # OAuth provider IDs
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Google OAuth user ID")
    apple_id = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Apple OAuth user ID")
    instagram_id = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Instagram OAuth user ID")

    # Email verification
    email_verified = models.BooleanField(default=False, help_text="Whether the user's email has been verified")
    email_verification_token = models.CharField(max_length=64, blank=True, null=True, help_text="Token for email verification")
    email_verification_token_created = models.DateTimeField(blank=True, null=True, help_text="When the verification token was created")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()
    
    class Meta:
        indexes = [
            models.Index(fields=['email'], name='auth_user_email_idx'),
            models.Index(fields=['google_id'], name='auth_user_google_id_idx'),
            models.Index(fields=['apple_id'], name='auth_user_apple_id_idx'),
            models.Index(fields=['instagram_id'], name='auth_user_instagram_id_idx'),
            models.Index(fields=['email_verified'], name='auth_user_email_verified_idx'),
            models.Index(fields=['is_active'], name='auth_user_is_active_idx'),
        ]
    
    def __str__(self):
        return self.email
    
    def generate_email_verification_token(self):
        """Generate a new email verification token."""
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_token_created = timezone.now()
        self.save(update_fields=['email_verification_token', 'email_verification_token_created'])
        return self.email_verification_token
    
    def verify_email_token(self, token):
        """Verify the email verification token."""
        if not self.email_verification_token or not self.email_verification_token_created:
            return False
        
        # Check if token matches
        if self.email_verification_token != token:
            return False
        
        # Check if token is expired (24 hours)
        expiry_time = self.email_verification_token_created + timedelta(hours=24)
        if timezone.now() > expiry_time:
            return False
        
        # Mark email as verified
        self.email_verified = True
        self.email_verification_token = None
        self.email_verification_token_created = None
        self.save(update_fields=['email_verified', 'email_verification_token', 'email_verification_token_created'])
        return True