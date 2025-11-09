from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role', 'profile_picture', 'banner_media', 'name', 'phone_number', 'birth_date', 'organizer_bio']
        extra_kwargs = {
            'password': {'write_only': True},
            'profile_picture': {'required': False},
            'banner_media': {'required': False},
            'name': {'required': False},
            'phone_number': {'required': False},
            'birth_date': {'required': False},
            'organizer_bio': {'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', 'guest')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            role=role
        )
        return user
