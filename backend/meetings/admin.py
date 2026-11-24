from django.contrib import admin

from .models import AcademicProfile, ActionItem, MentoringSession, SessionMilestone


@admin.register(AcademicProfile)
class AcademicProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department', 'academic_id', 'cgpa')
    list_filter = ('role', 'department')


@admin.register(MentoringSession)
class MentoringSessionAdmin(admin.ModelAdmin):
    list_display = (
        'session_code',
        'title',
        'mentor',
        'mentee',
        'status',
        'engagement_score',
        'sentiment_score',
        'scheduled_at',
    )
    list_filter = ('status', 'is_confidential', 'course_or_track')
    search_fields = ('session_code', 'title', 'raw_transcript')


@admin.register(ActionItem)
class ActionItemAdmin(admin.ModelAdmin):
    list_display = ('description', 'assignee_name', 'assignee_role', 'priority', 'due_label', 'status')
    list_filter = ('status', 'priority', 'assignee_role')


@admin.register(SessionMilestone)
class SessionMilestoneAdmin(admin.ModelAdmin):
    list_display = ('mentee', 'title', 'category', 'progress_pct', 'target_date')
    list_filter = ('category',)
