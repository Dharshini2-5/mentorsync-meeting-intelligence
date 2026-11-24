from django.urls import path

from . import views

urlpatterns = [
    # Public health & landing stats
    path('health/', views.health_check, name='health-check'),
    path('public/stats/', views.public_stats, name='public-stats'),

    # JWT Authentication
    path('auth/register/', views.auth_register, name='auth-register'),
    path('auth/login/', views.auth_login, name='auth-login'),
    path('auth/me/', views.auth_me, name='auth-me'),

    # Authenticated Dashboard
    path('dashboard/', views.dashboard_overview, name='dashboard-overview'),

    # Mentoring Sessions & NLP Workflows
    path('sessions/', views.session_list_create, name='session-list-create'),
    path('sessions/quick-analyze/', views.session_quick_analyze, name='session-quick-analyze'),
    path('sessions/<int:pk>/', views.session_detail, name='session-detail'),
    path('sessions/<int:pk>/analyze/', views.session_analyze, name='session-analyze'),
    path('sessions/<int:pk>/document/', views.session_document, name='session-document'),

    # Action Items & Follow-Ups
    path('action-items/', views.action_item_list_create, name='action-item-list-create'),
    path('action-items/<int:pk>/', views.action_item_detail, name='action-item-detail'),

    # Academic Milestones
    path('milestones/', views.milestone_list_create, name='milestone-list-create'),
    path('milestones/<int:pk>/', views.milestone_detail, name='milestone-detail'),
]
