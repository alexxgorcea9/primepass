"""
Email utilities for authentication flows.

This module handles sending verification emails, password reset emails,
and other authentication-related notifications.
"""

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_verification_email(user, verification_token):
    """
    Send email verification email to user.
    
    Args:
        user: User instance
        verification_token: Generated verification token
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_url = f"{frontend_url}/verify-email?token={verification_token}&email={user.email}"
        
        subject = "Verify your PrimePass email address"
        
        # HTML email content
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h1 style="color: #5469d4; margin-bottom: 20px;">Welcome to PrimePass!</h1>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hi {user.name or user.email},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for signing up! Please verify your email address to complete your registration and unlock all features.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #5469d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 14px; color: #5469d4; word-break: break-all;">
                    {verification_url}
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 13px; color: #999;">
                    This link will expire in 24 hours. If you didn't create a PrimePass account, you can safely ignore this email.
                </p>
                
                <p style="font-size: 13px; color: #999;">
                    - The PrimePass Team
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version (fallback)
        plain_message = f"""
        Welcome to PrimePass!
        
        Hi {user.name or user.email},
        
        Thank you for signing up! Please verify your email address to complete your registration.
        
        Click the link below to verify your email:
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create a PrimePass account, you can safely ignore this email.
        
        - The PrimePass Team
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Verification email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False


def send_verification_success_email(user):
    """
    Send confirmation email after successful verification.
    
    Args:
        user: User instance
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        login_url = f"{frontend_url}/login"
        
        subject = "Email verified successfully - Welcome to PrimePass!"
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h1 style="color: #28a745; margin-bottom: 20px;">✓ Email Verified!</h1>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hi {user.name or user.email},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Your email has been successfully verified. You now have full access to all PrimePass features!
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{login_url}" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    Thank you for joining PrimePass. We're excited to have you on board!
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 13px; color: #999;">
                    - The PrimePass Team
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_message = f"""
        Email Verified!
        
        Hi {user.name or user.email},
        
        Your email has been successfully verified. You now have full access to all PrimePass features!
        
        Thank you for joining PrimePass.
        
        - The PrimePass Team
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Verification success email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification success email to {user.email}: {str(e)}")
        return False


def send_account_lockout_email(user):
    """
    Send notification email when account is locked due to too many failed login attempts.
    
    Args:
        user: User instance
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        subject = "Security Alert: Account Temporarily Locked - PrimePass"
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; padding: 30px; border-radius: 10px; border-left: 4px solid #ffc107;">
                <h1 style="color: #856404; margin-bottom: 20px;">🔒 Account Temporarily Locked</h1>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hi {user.name or user.email},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Your PrimePass account has been temporarily locked due to multiple failed login attempts.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="font-size: 14px; margin: 0;">
                        <strong>Lockout Duration:</strong> 1 hour<br>
                        <strong>Email:</strong> {user.email}
                    </p>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    <strong>What happened?</strong><br>
                    Someone tried to log into your account multiple times with incorrect credentials. To protect your account, we've temporarily locked it.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    <strong>What should I do?</strong>
                </p>
                <ul style="font-size: 15px; margin-bottom: 20px;">
                    <li>Wait 1 hour and try logging in again</li>
                    <li>Make sure you're using the correct password</li>
                    <li>If you didn't try to log in, someone may be attempting to access your account</li>
                    <li>Consider changing your password after the lockout period</li>
                </ul>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 13px; color: #999;">
                    If you didn't attempt to log in, please secure your account immediately after the lockout period expires.
                </p>
                
                <p style="font-size: 13px; color: #999;">
                    - The PrimePass Security Team
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_message = f"""
        Account Temporarily Locked
        
        Hi {user.name or user.email},
        
        Your PrimePass account has been temporarily locked due to multiple failed login attempts.
        
        Lockout Duration: 1 hour
        Email: {user.email}
        
        What happened?
        Someone tried to log into your account multiple times with incorrect credentials. 
        To protect your account, we've temporarily locked it.
        
        What should I do?
        - Wait 1 hour and try logging in again
        - Make sure you're using the correct password
        - If you didn't try to log in, someone may be attempting to access your account
        - Consider changing your password after the lockout period
        
        If you didn't attempt to log in, please secure your account immediately after 
        the lockout period expires.
        
        - The PrimePass Security Team
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Don't fail the lockout if email fails
        )
        
        logger.info(f"Account lockout notification sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send account lockout email to {user.email}: {str(e)}")
        return False
