from django.shortcuts import render
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.db import transaction
from drf_spectacular.utils import extend_schema
import logging

from .models import UserProfile, Address
from .serializers import (
    MyTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    AddressSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .permissions import IsOwner, IsOwnerOrAdmin


logger = logging.getLogger(__name__)


@extend_schema(tags=['Users'])
class LoginAPIView(TokenObtainPairView):
    """
    Vista de login personalizada que usa nuestro serializer
    para aceptar email/username y devolver los datos del usuario
    """
    serializer_class = MyTokenObtainPairSerializer


@extend_schema(tags=['Users'])
class UserRegistrationAPIView(generics.CreateAPIView):
    """
    Registro de nuevos usuarios con generación automática de tokens
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # Generar tokens JWT
                refresh = RefreshToken.for_user(user)
                
                # Enviar email de bienvenida de forma asíncrona
                try:
                    send_mail(
                        subject='¡Bienvenido a Home Store!',
                        message=f'Hola {user.first_name},\n\nGracias por registrarte en Home Store.\n\nTu cuenta ha sido creada exitosamente.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=True,
                    )
                except Exception as e:
                    logger.warning(f"Failed to send welcome email to {user.email}: {str(e)}")
                
                logger.info(f"New user registered: {user.username} ({user.email})")
                
                return Response({
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    },
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'message': 'Usuario registrado exitosamente'
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error during user registration: {str(e)}")
            return Response(
                {"error": "Error al registrar usuario"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(tags=['Users'])
class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión del perfil de usuario
    """
    queryset = UserProfile.objects.select_related('user')
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch']  # Desactivar POST y DELETE explícitamente
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserProfileSerializer
    
    def get_object(self):
        """
        Siempre devuelve el perfil del usuario autenticado
        """
        return self.request.user.profile
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/users/profile/ - Obtener perfil del usuario actual
        """
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """
        PUT/PATCH /api/users/profile/ - Actualizar perfil
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            self.perform_update(serializer)
        
        logger.info(f"Profile updated for user {request.user.username}")
        
        return Response(serializer.data)


@extend_schema(tags=['Users'])
class ChangePasswordAPIView(generics.UpdateAPIView):
    """
    Cambiar contraseña del usuario autenticado
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = self.get_object()
        
        # Validar contraseña actual
        old_password = serializer.validated_data.get('old_password')
        if not user.check_password(old_password):
            return Response(
                {"error": "La contraseña actual es incorrecta"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar contraseña
        new_password = serializer.validated_data.get('new_password')
        user.set_password(new_password)
        user.save(update_fields=['password'])
        
        logger.info(f"Password changed for user {user.username}")
        
        # Enviar notificación de cambio de contraseña
        try:
            send_mail(
                subject='Contraseña actualizada',
                message=f'Hola {user.first_name},\n\nTu contraseña ha sido actualizada exitosamente.\n\nSi no realizaste este cambio, contacta soporte inmediatamente.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f"Failed to send password change email to {user.email}: {str(e)}")
        
        return Response(
            {'message': 'Contraseña actualizada exitosamente'},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Users'])
class PasswordResetRequestAPIView(generics.GenericAPIView):
    """
    Solicitar reset de contraseña por email
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email__iexact=email)
            
            # Generar token seguro
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Construir URL de reset
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"
            
            # Enviar email
            try:
                send_mail(
                    subject='Recuperación de contraseña - Home Store',
                    message=f'Hola {user.first_name},\n\nHas solicitado restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n{reset_url}\n\nEste enlace expirará en 24 horas.\n\nSi no solicitaste este cambio, ignora este mensaje.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                
                logger.info(f"Password reset email sent to {user.email}")
                
                return Response(
                    {'message': 'Se ha enviado un email con instrucciones para restablecer tu contraseña'},
                    status=status.HTTP_200_OK
                )
            
            except Exception as e:
                logger.error(f"Error sending password reset email: {str(e)}")
                return Response(
                    {'error': 'Error al enviar el email. Intenta nuevamente más tarde.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            logger.warning(f"Password reset requested for non-existent email: {email}")
            return Response(
                {'message': 'Se ha enviado un email con instrucciones para restablecer tu contraseña'},
                status=status.HTTP_200_OK
            )


@extend_schema(tags=['Users'])
class PasswordResetConfirmAPIView(generics.GenericAPIView):
    """
    Confirmar reset de contraseña con token
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        if not uid or not token:
            return Response(
                {'error': 'UID y token son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decodificar UID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            logger.warning(f"Invalid UID in password reset: {uid}")
            return Response(
                {'error': 'El enlace de restablecimiento es inválido o ha expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar token
        if not default_token_generator.check_token(user, token):
            logger.warning(f"Invalid token for password reset: user={user.username}")
            return Response(
                {'error': 'El enlace de restablecimiento es inválido o ha expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar y cambiar contraseña
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save(update_fields=['password'])
        
        logger.info(f"Password reset completed for user {user.username}")
        
        # Enviar confirmación por email
        try:
            send_mail(
                subject='Contraseña restablecida - Home Store',
                message=f'Hola {user.first_name},\n\nTu contraseña ha sido restablecida exitosamente.\n\nSi no realizaste este cambio, contacta soporte inmediatamente.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f"Failed to send password reset confirmation email: {str(e)}")
        
        return Response(
            {'message': 'Contraseña restablecida exitosamente'},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Users'])
class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de direcciones del usuario
    """
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """
        Optimizar consultas y filtrar por usuario
        """
        return Address.objects.filter(
            user=self.request.user
        ).select_related('user').order_by('-is_default', '-created_at')
    
    def perform_create(self, serializer):
        """
        Crear dirección asignando automáticamente el usuario
        """
        with transaction.atomic():
            # Si es la primera dirección, hacerla predeterminada
            if not Address.objects.filter(user=self.request.user).exists():
                serializer.save(user=self.request.user, is_default=True)
            else:
                serializer.save(user=self.request.user)
            
            logger.info(f"New address created for user {self.request.user.username}")
    
    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        """
        Establecer dirección como predeterminada
        POST /api/addresses/{id}/set-default/
        """
        try:
            with transaction.atomic():
                # Remover default de todas las direcciones del usuario
                Address.objects.filter(
                    user=request.user,
                    is_default=True
                ).update(is_default=False)
                
                # Establecer la nueva dirección como default
                address = self.get_object()
                address.is_default = True
                address.save(update_fields=['is_default'])
                
                logger.info(f"Default address updated for user {request.user.username}")
                
                return Response(
                    {'message': 'Dirección predeterminada actualizada'},
                    status=status.HTTP_200_OK
                )
        
        except Exception as e:
            logger.error(f"Error setting default address: {str(e)}")
            return Response(
                {'error': 'Error al actualizar la dirección predeterminada'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )