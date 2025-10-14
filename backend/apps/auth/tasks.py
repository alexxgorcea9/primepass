"""
Celery tasks for authentication app.

This module contains background tasks for authentication-related operations:
- Token cleanup (JWT blacklist maintenance)
- Session cleanup
- Security audits
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
import logging

logger = logging.getLogger(__name__)


@shared_task(name='apps.auth.tasks.cleanup_expired_tokens')
def cleanup_expired_tokens():
    """
    Clean up expired JWT tokens from the database.
    
    This task removes:
    1. Expired outstanding tokens (older than 30 days)
    2. Associated blacklisted tokens
    
    Prevents unbounded growth of token tables which can cause performance issues
    at scale (10K+ concurrent users generate lots of tokens).
    
    Runs: Every hour (configured in celery.py beat_schedule)
    """
    cutoff_date = timezone.now() - timedelta(days=30)
    
    try:
        # Delete expired outstanding tokens
        expired_tokens = OutstandingToken.objects.filter(expires_at__lt=cutoff_date)
        expired_count = expired_tokens.count()
        
        if expired_count > 0:
            # Delete associated blacklisted tokens first (foreign key constraint)
            BlacklistedToken.objects.filter(token__in=expired_tokens).delete()
            
            # Delete outstanding tokens
            expired_tokens.delete()
            
            logger.info(f"Cleaned up {expired_count} expired JWT tokens")
            return {
                'success': True,
                'deleted_count': expired_count,
                'cutoff_date': cutoff_date.isoformat()
            }
        else:
            logger.debug("No expired tokens to clean up")
            return {
                'success': True,
                'deleted_count': 0,
                'cutoff_date': cutoff_date.isoformat()
            }
    
    except Exception as e:
        logger.error(f"Error cleaning up expired tokens: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }


@shared_task(name='apps.auth.tasks.cleanup_unverified_accounts')
def cleanup_unverified_accounts():
    """
    Clean up user accounts that were never verified after 7 days.
    
    This prevents spam signups from cluttering the database.
    
    Runs: Daily (configured in celery.py beat_schedule)
    """
    from .models import User
    
    cutoff_date = timezone.now() - timedelta(days=7)
    
    try:
        # Find users who signed up more than 7 days ago and never verified
        unverified_users = User.objects.filter(
            email_verified=False,
            date_joined__lt=cutoff_date,
            last_login__isnull=True  # Never logged in
        ).exclude(
            email__endswith='@instagram.primepass.internal'  # Keep OAuth users
        )
        
        count = unverified_users.count()
        
        if count > 0:
            unverified_users.delete()
            logger.info(f"Cleaned up {count} unverified accounts older than 7 days")
            return {
                'success': True,
                'deleted_count': count,
                'cutoff_date': cutoff_date.isoformat()
            }
        else:
            logger.debug("No unverified accounts to clean up")
            return {
                'success': True,
                'deleted_count': 0,
                'cutoff_date': cutoff_date.isoformat()
            }
    
    except Exception as e:
        logger.error(f"Error cleaning up unverified accounts: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }


@shared_task(name='apps.auth.tasks.monitor_failed_login_attempts')
def monitor_failed_login_attempts():
    """
    Monitor and report on failed login attempts for security analysis.
    
    This task aggregates data from django-axes for security monitoring.
    Can be extended to send alerts for suspicious activity.
    
    Runs: Every hour (configured in celery.py beat_schedule)
    """
    try:
        from axes.models import AccessAttempt
        
        # Count failed attempts in last hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_failures = AccessAttempt.objects.filter(
            attempt_time__gte=one_hour_ago,
            failures_since_start__gt=0
        )
        
        failure_count = recent_failures.count()
        
        if failure_count > 100:  # Alert threshold for high-scale app
            logger.warning(f"High number of failed login attempts: {failure_count} in the last hour")
        else:
            logger.debug(f"Failed login attempts in last hour: {failure_count}")
        
        return {
            'success': True,
            'failed_attempts_last_hour': failure_count,
            'timestamp': timezone.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error monitoring failed login attempts: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }
