from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# ----------------------------
# 1️⃣ USER MODEL
# ----------------------------

class UserRole(models.TextChoices):
    GUEST = 'Guest'
    ORGANIZER = 'Organizer'
    TEAM = 'Team'

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

    phone_number = models.CharField()
    age = models.PositiveSmallIntegerField()
    name = models.CharField()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email



class Organizer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organizer_profile')
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.email