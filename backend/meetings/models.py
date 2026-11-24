from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class AcademicProfile(models.Model):
    ROLE_CHOICES = [
        ('MENTOR', 'Faculty Mentor'),
        ('MENTEE', 'Student Mentee'),
        ('COORDINATOR', 'Academic Coordinator'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='academic_profile',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MENTEE')
    department = models.CharField(
        max_length=120,
        default='Electronics & Communication Engineering',
    )
    academic_id = models.CharField(max_length=50, blank=True, default='')
    specialization = models.CharField(max_length=150, blank=True, default='')
    cgpa = models.FloatField(null=True, blank=True)
    avatar_color = models.CharField(max_length=20, default='#14B8A6')

    class Meta:
        ordering = ['role', 'user__first_name']

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"


class MentoringSession(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('PROCESSED', 'NLP Processed'),
    ]

    title = models.CharField(max_length=220)
    session_code = models.CharField(max_length=40, unique=True, blank=True)
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentored_sessions',
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentee_sessions',
    )
    course_or_track = models.CharField(max_length=140, default='Academic Mentoring')
    scheduled_at = models.DateTimeField(default=timezone.now)
    duration_minutes = models.PositiveIntegerField(default=45)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')

    raw_transcript = models.TextField(blank=True, default='')
    executive_summary = models.TextField(blank=True, default='')
    key_insights = models.JSONField(default=list, blank=True)
    decisions = models.JSONField(default=list, blank=True)
    topics = models.JSONField(default=list, blank=True)
    speaker_metrics = models.JSONField(default=dict, blank=True)

    sentiment_score = models.FloatField(default=0.0)
    engagement_score = models.FloatField(default=0.0)
    generated_markdown_doc = models.TextField(blank=True, default='')
    is_confidential = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_at', '-created_at']

    def save(self, *args, **kwargs):
        if not self.session_code:
            year = (self.scheduled_at or timezone.now()).year
            last = MentoringSession.objects.order_by('-id').first()
            seq = (last.id + 1) if last else 1
            candidate = f"MS-{year}-{seq:03d}"
            while MentoringSession.objects.filter(session_code=candidate).exists():
                seq += 1
                candidate = f"MS-{year}-{seq:03d}"
            self.session_code = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.session_code}] {self.title}"


class ActionItem(models.Model):
    ASSIGNEE_ROLE_CHOICES = [
        ('MENTOR', 'Mentor'),
        ('MENTEE', 'Mentee'),
    ]
    PRIORITY_CHOICES = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    session = models.ForeignKey(
        MentoringSession,
        on_delete=models.CASCADE,
        related_name='action_items',
    )
    description = models.TextField()
    assignee_name = models.CharField(max_length=120)
    assignee_role = models.CharField(
        max_length=20,
        choices=ASSIGNEE_ROLE_CHOICES,
        default='MENTEE',
    )
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    due_label = models.CharField(max_length=80, default='Next Check-in')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['status', '-created_at']

    def __str__(self):
        return f"{self.assignee_name}: {self.description[:50]}"


class SessionMilestone(models.Model):
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='milestones',
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=80, default='Academics & Coursework')
    progress_pct = models.PositiveIntegerField(default=0)
    target_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['target_date', '-progress_pct']

    def __str__(self):
        return f"{self.mentee.get_full_name() or self.mentee.username} — {self.title} ({self.progress_pct}%)"
