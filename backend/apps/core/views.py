from django.http import JsonResponse


def health_check(request):
    """Health check endpoint for Docker healthcheck."""
    return JsonResponse({"status": "healthy"}, status=200)
