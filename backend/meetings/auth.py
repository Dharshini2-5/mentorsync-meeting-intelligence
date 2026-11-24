"""Custom HS256 JWT Authentication for MentorSync AI."""
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication, exceptions


def generate_jwt_token(user: User) -> str:
    """Create a signed HS256 JWT token for an authenticated user."""
    profile = getattr(user, 'academic_profile', None)
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=getattr(settings, 'JWT_EXPIRY_HOURS', 48))

    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'role': profile.role if profile else 'MENTEE',
        'iat': int(now.timestamp()),
        'exp': int(exp.timestamp()),
    }
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=getattr(settings, 'JWT_ALGORITHM', 'HS256'),
    )
    return token if isinstance(token, str) else token.decode('utf-8')


def decode_jwt_token(token: str) -> dict:
    """Decode and validate a signed JWT token."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[getattr(settings, 'JWT_ALGORITHM', 'HS256')],
        )
    except jwt.ExpiredSignatureError as exc:
        raise exceptions.AuthenticationFailed('Session token has expired. Please sign in again.') from exc
    except jwt.InvalidTokenError as exc:
        raise exceptions.AuthenticationFailed('Invalid authentication token.') from exc


class JWTAuthentication(authentication.BaseAuthentication):
    """DRF Authentication class using Authorization: Bearer <JWT>."""

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8').strip()
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            return None

        token = parts[1]
        payload = decode_jwt_token(token)
        user_id = payload.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('Malformed token payload.')

        try:
            user = User.objects.select_related('academic_profile').get(pk=user_id, is_active=True)
        except User.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed('Authenticated user account not found.') from exc

        return (user, token)

    def authenticate_header(self, request):
        return self.keyword
