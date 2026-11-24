from django.contrib.auth.models import User
from rest_framework import serializers

from .models import AcademicProfile, ActionItem, MentoringSession, SessionMilestone


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.CharField(source='academic_profile.role', read_only=True)
    department = serializers.CharField(source='academic_profile.department', read_only=True)
    academic_id = serializers.CharField(source='academic_profile.academic_id', read_only=True)
    specialization = serializers.CharField(source='academic_profile.specialization', read_only=True)
    cgpa = serializers.FloatField(source='academic_profile.cgpa', read_only=True)
    avatar_color = serializers.CharField(source='academic_profile.avatar_color', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'department',
            'academic_id',
            'specialization',
            'cgpa',
            'avatar_color',
        ]

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


class ActionItemSerializer(serializers.ModelSerializer):
    session_code = serializers.CharField(source='session.session_code', read_only=True)
    session_title = serializers.CharField(source='session.title', read_only=True)

    class Meta:
        model = ActionItem
        fields = [
            'id',
            'session',
            'session_code',
            'session_title',
            'description',
            'assignee_name',
            'assignee_role',
            'priority',
            'due_label',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'session_code', 'session_title']


class MentoringSessionListSerializer(serializers.ModelSerializer):
    mentor_name = serializers.SerializerMethodField()
    mentee_name = serializers.SerializerMethodField()
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    action_item_count = serializers.SerializerMethodField()
    open_action_count = serializers.SerializerMethodField()
    decision_count = serializers.SerializerMethodField()
    top_topic = serializers.SerializerMethodField()

    class Meta:
        model = MentoringSession
        fields = [
            'id',
            'session_code',
            'title',
            'mentor',
            'mentor_name',
            'mentor_email',
            'mentee',
            'mentee_name',
            'mentee_email',
            'course_or_track',
            'scheduled_at',
            'duration_minutes',
            'status',
            'executive_summary',
            'topics',
            'sentiment_score',
            'engagement_score',
            'is_confidential',
            'action_item_count',
            'open_action_count',
            'decision_count',
            'top_topic',
            'created_at',
        ]

    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.username

    def get_mentee_name(self, obj):
        return obj.mentee.get_full_name() or obj.mentee.username

    def get_action_item_count(self, obj):
        return obj.action_items.count()

    def get_open_action_count(self, obj):
        return obj.action_items.exclude(status='COMPLETED').count()

    def get_decision_count(self, obj):
        return len(obj.decisions or [])

    def get_top_topic(self, obj):
        topics = obj.topics or []
        return topics[0]['name'] if topics else obj.course_or_track


class MentoringSessionDetailSerializer(MentoringSessionListSerializer):
    action_items = ActionItemSerializer(many=True, read_only=True)
    mentor_profile = UserProfileSerializer(source='mentor', read_only=True)
    mentee_profile = UserProfileSerializer(source='mentee', read_only=True)

    class Meta(MentoringSessionListSerializer.Meta):
        fields = MentoringSessionListSerializer.Meta.fields + [
            'raw_transcript',
            'key_insights',
            'decisions',
            'speaker_metrics',
            'generated_markdown_doc',
            'action_items',
            'mentor_profile',
            'mentee_profile',
            'updated_at',
        ]


class SessionMilestoneSerializer(serializers.ModelSerializer):
    mentee_name = serializers.SerializerMethodField()

    class Meta:
        model = SessionMilestone
        fields = [
            'id',
            'mentee',
            'mentee_name',
            'title',
            'category',
            'progress_pct',
            'target_date',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at', 'mentee_name']

    def get_mentee_name(self, obj):
        return obj.mentee.get_full_name() or obj.mentee.username
