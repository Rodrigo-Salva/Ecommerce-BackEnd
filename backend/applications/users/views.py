from django.shortcuts import render

# Create your views here.
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from drf_spectacular.utils import extend_schema, extend_schema_view


from .models import UserProfile, Address
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    AddressSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .permissions import IsOwner, IsOwnerOrAdmin

@extend_schema(tags=['Users'])
class UserRegistrationAPIView(generics.CreateAPIView):
    """
    Endpoint para registro de nuevos usuarios
    POST /api/users/register/
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Enviar email de bienvenida (opcional)
        try:
            send_mail(
                subject='¡Bienvenido a Home Store!',
                message=f'Hola {user.first_name},\n\n'
                        f'Gracias por registrarte en Home Store.\n\n'
                        f'Tu cuenta ha sido creada exitosamente.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except:
            pass
        
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


@extend_schema(tags=['Users'])
class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de perfil de usuario
    GET /api/users/profile/ - Obtener perfil
    PUT /api/users/profile/ - Actualizar perfil completo
    PATCH /api/users/profile/ - Actualización parcial
    """
    queryset = UserProfile.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserProfileSerializer
    
    def get_object(self):
        """
        Retorna el perfil del usuario autenticado
        """
        return self.request.user.profile
    
    def list(self, request, *args, **kwargs):
        """
        Retorna solo el perfil del usuario autenticado
        """
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        No permitir crear perfiles manualmente
        """
        return Response(
            {'detail': 'Los perfiles se crean automáticamente al registrarse.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        No permitir eliminar perfiles
        """
        return Response(
            {'detail': 'No puedes eliminar tu perfil.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )


@extend_schema(tags=['Users'])
class ChangePasswordAPIView(generics.UpdateAPIView):
    """
    Endpoint para cambiar contraseña
    POST /api/users/change-password/
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Contraseña actualizada exitosamente'
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Users'])
class PasswordResetRequestAPIView(generics.GenericAPIView):
    """
    Solicitar reset de contraseña por email
    POST /api/users/reset-password/
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generar token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # URL de reset (ajustar según tu frontend)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        # Enviar email
        try:
            send_mail(
                subject='Recuperación de contraseña - Home Store',
                message=f'Hola {user.first_name},\n\n'
                        f'Has solicitado restablecer tu contraseña.\n\n'
                        f'Haz clic en el siguiente enlace para crear una nueva contraseña:\n'
                        f'{reset_url}\n\n'
                        f'Si no solicitaste esto, ignora este email.\n\n'
                        f'El enlace expira en 24 horas.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({
                'message': 'Se ha enviado un email con instrucciones para restablecer tu contraseña.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Error al enviar el email. Intenta nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(tags=['Users'])
class PasswordResetConfirmAPIView(generics.GenericAPIView):
    """
    Confirmar reset de contraseña con token
    POST /api/users/reset-password-confirm/
    Body: { "uid": "...", "token": "...", "new_password": "...", "new_password2": "..." }
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Token inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({
                'error': 'Token inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Actualizar contraseña
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Contraseña restablecida exitosamente'
        }, status=status.HTTP_200_OK)

@extend_schema(tags=['Users'])
class AddressViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para direcciones del usuario
    GET /api/users/addresses/ - Listar direcciones
    POST /api/users/addresses/ - Crear dirección
    PUT /api/users/addresses/{id}/ - Actualizar dirección
    DELETE /api/users/addresses/{id}/ - Eliminar dirección
    """
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """
        Retorna solo las direcciones del usuario autenticado
        """
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """
        Asigna automáticamente el usuario autenticado
        """
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """
        Marcar una dirección como predeterminada
        POST /api/users/addresses/{id}/set_default/
        """
        address = self.get_object()
        address.is_default = True
        address.save()
        
        return Response({
            'message': 'Dirección marcada como predeterminada'
        }, status=status.HTTP_200_OK)