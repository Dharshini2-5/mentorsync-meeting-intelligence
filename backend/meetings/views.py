from collections import Counter
from datetime import datetime

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Avg, Case, IntegerField, Q, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .auth import generate_jwt_token
from .models import AcademicProfile, ActionItem, MentoringSession, SessionMilestone
from .nlp_summarizer import analyze_transcript, generate_markdown_minutes
from .serializers import (
    ActionItemSerializer,
    MentoringSessionDetailSerializer,
    MentoringSessionListSerializer,
    SessionMilestoneSerializer,
    UserProfileSerializer,
)


def _get_user_role(user: User) -> str:
    profile = getattr(user, 'academic_profile', None)
    return profile.role if profile else 'MENTEE'


def _scoped_sessions_for_user(user: User):
    role = _get_user_role(user)
    qs = MentoringSession.objects.select_related(
        'mentor', 'mentor__academic_profile', 'mentee', 'mentee__academic_profile'
    ).prefetch_related('action_items')
    if role == 'COORDINATOR' or user.is_superuser:
        return qs
    if role == 'MENTOR':
        return qs.filter(Q(mentor=user) | Q(is_confidential=False))
    # MENTEE sees their own sessions securely
    return qs.filter(mentee=user)


def _refresh_session_markdown(session: MentoringSession) -> str:
    """Regenerate automated Markdown minutes reflecting current ActionItem statuses."""
    items_payload = [
        {
            'description': item.description,
            'assignee_name': item.assignee_name,
            'assignee_role': item.assignee_role,
            'priority': item.priority,
            'due_label': item.due_label,
            'status': item.status,
        }
        for item in session.action_items.all()
    ]
    md = generate_markdown_minutes(
        session_code=session.session_code,
        title=session.title,
        mentor_name=session.mentor.get_full_name() or session.mentor.username,
        mentee_name=session.mentee.get_full_name() or session.mentee.username,
        course_or_track=session.course_or_track,
        scheduled_at=session.scheduled_at,
        duration_minutes=session.duration_minutes,
        executive_summary=session.executive_summary,
        topics=session.topics or [],
        insights=session.key_insights or [],
        decisions=session.decisions or [],
        action_items=items_payload,
        speaker_metrics=session.speaker_metrics or {},
        sentiment_score=session.sentiment_score,
        engagement_score=session.engagement_score,
        is_confidential=session.is_confidential,
    )
    session.generated_markdown_doc = md
    session.save(update_fields=['generated_markdown_doc', 'updated_at'])
    return md


def _run_nlp_and_persist(session: MentoringSession, replace_actions: bool = True) -> dict:
    mentor_name = session.mentor.get_full_name() or session.mentor.username
    mentee_name = session.mentee.get_full_name() or session.mentee.username

    result = analyze_transcript(
        session.raw_transcript,
        session_code=session.session_code,
        title=session.title,
        mentor_name=mentor_name,
        mentee_name=mentee_name,
        course_or_track=session.course_or_track,
        scheduled_at=session.scheduled_at,
        duration_minutes=session.duration_minutes,
        is_confidential=session.is_confidential,
    )

    session.executive_summary = result['executive_summary']
    session.key_insights = result['key_insights']
    session.decisions = result['decisions']
    session.topics = result['topics']
    session.speaker_metrics = result['speaker_metrics']
    session.sentiment_score = result['sentiment_score']
    session.engagement_score = result['engagement_score']
    session.generated_markdown_doc = result['generated_markdown_doc']
    session.status = 'PROCESSED'
    session.save()

    if replace_actions:
        session.action_items.all().delete()
        for item in result['action_items']:
            ActionItem.objects.create(
                session=session,
                description=item['description'],
                assignee_name=item['assignee_name'],
                assignee_role=item['assignee_role'],
                priority=item['priority'],
                due_label=item['due_label'],
                status=item.get('status', 'PENDING'),
            )
    return result


# ---------------------------------------------------------------------------
# Public Health & Landing Stats
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'ok',
        'service': 'MentorSync AI — Smart Meeting Intelligence Backend',
        'timestamp': timezone.now().isoformat(),
        'sessions_indexed': MentoringSession.objects.count(),
        'action_items_tracked': ActionItem.objects.count(),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_stats(request):
    """Aggregate anonymized platform metrics for the public Splash Page."""
    sessions = MentoringSession.objects.all()
    total_sessions = sessions.count()
    processed_sessions = sessions.filter(status='PROCESSED').count()
    total_actions = ActionItem.objects.count()
    completed_actions = ActionItem.objects.filter(status='COMPLETED').count()

    avgs = sessions.filter(status='PROCESSED').aggregate(
        avg_engagement=Avg('engagement_score'),
        avg_sentiment=Avg('sentiment_score'),
    )

    total_words = 0
    total_decisions = 0
    topic_counter: Counter[str] = Counter()
    for s in sessions:
        metrics = s.speaker_metrics or {}
        total_words += int(metrics.get('total_words', 0))
        total_decisions += len(s.decisions or [])
        for t in (s.topics or [])[:2]:
            topic_counter[t['name']] += 1

    return Response({
        'total_sessions': total_sessions,
        'processed_sessions': processed_sessions,
        'total_action_items': total_actions,
        'completed_action_items': completed_actions,
        'completion_rate': round((completed_actions / max(1, total_actions)) * 100, 1),
        'avg_engagement_score': round(avgs['avg_engagement'] or 86.5, 1),
        'avg_sentiment_score': round(avgs['avg_sentiment'] or 79.2, 1),
        'total_words_analyzed': total_words,
        'total_decisions_captured': total_decisions,
        'total_mentors': AcademicProfile.objects.filter(role='MENTOR').count(),
        'total_mentees': AcademicProfile.objects.filter(role='MENTEE').count(),
        'top_topics': [{'name': k, 'count': v} for k, v in topic_counter.most_common(4)],
    })


# ---------------------------------------------------------------------------
# JWT Authentication Endpoints
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''
    full_name = (request.data.get('full_name') or '').strip()
    role = (request.data.get('role') or 'MENTEE').upper()
    department = (request.data.get('department') or 'Electronics & Communication Engineering').strip()
    specialization = (request.data.get('specialization') or 'AI & Embedded Systems').strip()

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
    if role not in ('MENTOR', 'MENTEE', 'COORDINATOR'):
        role = 'MENTEE'
    if User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).exists():
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    name_parts = full_name.split(None, 1) if full_name else [email.split('@')[0].title()]
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    prefix = {'MENTOR': 'FAC', 'MENTEE': 'STU', 'COORDINATOR': 'CRD'}[role]
    color = {'MENTOR': '#6366F1', 'MENTEE': '#14B8A6', 'COORDINATOR': '#FB923C'}[role]
    AcademicProfile.objects.create(
        user=user,
        role=role,
        department=department,
        academic_id=f"AU-{prefix}-{user.id:03d}",
        specialization=specialization,
        cgpa=8.4 if role == 'MENTEE' else None,
        avatar_color=color,
    )

    token = generate_jwt_token(user)
    return Response(
        {
            'token': token,
            'user': UserProfileSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    identifier = (request.data.get('email') or request.data.get('username') or '').strip()
    password = request.data.get('password') or ''

    if not identifier or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Support login via email or username
    matched_user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
    if not matched_user:
        return Response({'error': 'Invalid credentials. Please check your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(username=matched_user.username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials. Please check your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(user, 'academic_profile'):
        AcademicProfile.objects.create(user=user, role='MENTEE')

    token = generate_jwt_token(user)
    return Response({
        'token': token,
        'user': UserProfileSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_me(request):
    mentors = User.objects.select_related('academic_profile').filter(academic_profile__role='MENTOR')
    mentees = User.objects.select_related('academic_profile').filter(academic_profile__role='MENTEE')
    return Response({
        'user': UserProfileSerializer(request.user).data,
        'directory': {
            'mentors': UserProfileSerializer(mentors, many=True).data,
            'mentees': UserProfileSerializer(mentees, many=True).data,
        },
    })


# ---------------------------------------------------------------------------
# Authenticated Dashboard Analytics
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    sessions_qs = _scoped_sessions_for_user(request.user)
    sessions_list = list(sessions_qs.order_by('scheduled_at'))
    session_ids = [s.id for s in sessions_list]

    actions_qs = ActionItem.objects.filter(session_id__in=session_ids).select_related('session')
    total_actions = actions_qs.count()
    completed_actions = actions_qs.filter(status='COMPLETED').count()
    in_progress_actions = actions_qs.filter(status='IN_PROGRESS').count()
    pending_actions = actions_qs.filter(status='PENDING').count()
    open_actions = total_actions - completed_actions

    role = _get_user_role(request.user)
    if role == 'MENTEE':
        milestones_qs = SessionMilestone.objects.filter(mentee=request.user).select_related('mentee')
    else:
        milestones_qs = SessionMilestone.objects.all().select_related('mentee')

    milestones_list = list(milestones_qs)
    avg_milestone_progress = (
        round(sum(m.progress_pct for m in milestones_list) / len(milestones_list), 1)
        if milestones_list else 0.0
    )

    processed = [s for s in sessions_list if s.status == 'PROCESSED']
    avg_engagement = (
        round(sum(s.engagement_score for s in processed) / len(processed), 1)
        if processed else 0.0
    )
    avg_sentiment = (
        round(sum(s.sentiment_score for s in processed) / len(processed), 1)
        if processed else 0.0
    )
    total_decisions = sum(len(s.decisions or []) for s in processed)
    total_words = sum(int((s.speaker_metrics or {}).get('total_words', 0)) for s in processed)

    # Engagement & Sentiment longitudinal trend
    engagement_trend = []
    for s in sessions_list:
        short = s.title if len(s.title) <= 24 else s.title[:22] + '…'
        engagement_trend.append({
            'id': s.id,
            'session_code': s.session_code,
            'short_title': short,
            'full_title': s.title,
            'date': s.scheduled_at.strftime('%b %d'),
            'engagement_score': s.engagement_score,
            'sentiment_score': s.sentiment_score,
            'action_count': s.action_items.count(),
        })

    # Aggregated topic distribution across sessions
    topic_weights: dict[str, dict] = {}
    for s in processed:
        for t in (s.topics or []):
            name = t['name']
            if name not in topic_weights:
                topic_weights[name] = {
                    'name': name,
                    'color': t.get('color', '#14B8A6'),
                    'score': 0.0,
                    'sessions': 0,
                }
            topic_weights[name]['score'] += float(t.get('share_pct', 0))
            topic_weights[name]['sessions'] += 1

    total_topic_score = sum(v['score'] for v in topic_weights.values()) or 1.0
    topic_distribution = sorted(
        [
            {
                'name': v['name'],
                'color': v['color'],
                'share_pct': round((v['score'] / total_topic_score) * 100.0, 1),
                'sessions': v['sessions'],
            }
            for v in topic_weights.values()
        ],
        key=lambda x: x['share_pct'],
        reverse=True,
    )

    priority_followups = (
        actions_qs.exclude(status='COMPLETED')
        .annotate(
            prio_order=Case(
                When(priority='HIGH', then=Value(0)),
                When(priority='MEDIUM', then=Value(1)),
                default=Value(2),
                output_field=IntegerField(),
            )
        )
        .order_by('prio_order', '-created_at')[:8]
    )

    return Response({
        'kpis': {
            'total_sessions': len(sessions_list),
            'processed_sessions': len(processed),
            'avg_engagement': avg_engagement,
            'avg_sentiment': avg_sentiment,
            'open_action_items': open_actions,
            'completed_action_items': completed_actions,
            'total_action_items': total_actions,
            'completion_rate': round((completed_actions / max(1, total_actions)) * 100, 1),
            'total_decisions': total_decisions,
            'total_words_analyzed': total_words,
            'avg_milestone_progress': avg_milestone_progress,
        },
        'engagement_trend': engagement_trend,
        'topic_distribution': topic_distribution,
        'action_status_breakdown': [
            {'name': 'Pending', 'value': pending_actions, 'color': '#FB923C'},
            {'name': 'In Progress', 'value': in_progress_actions, 'color': '#6366F1'},
            {'name': 'Completed', 'value': completed_actions, 'color': '#14B8A6'},
        ],
        'priority_followups': ActionItemSerializer(priority_followups, many=True).data,
        'milestones': SessionMilestoneSerializer(milestones_list, many=True).data,
        'recent_sessions': MentoringSessionListSerializer(
            list(reversed(sessions_list))[:5], many=True
        ).data,
    })


# ---------------------------------------------------------------------------
# Sessions CRUD & NLP Workflows
# ---------------------------------------------------------------------------

def _resolve_mentor_and_mentee(request):
    mentor_id = request.data.get('mentor') or request.data.get('mentor_id')
    mentee_id = request.data.get('mentee') or request.data.get('mentee_id')
    user = request.user
    role = _get_user_role(user)

    mentor = User.objects.filter(pk=mentor_id).first() if mentor_id else None
    mentee = User.objects.filter(pk=mentee_id).first() if mentee_id else None

    if not mentor:
        if role == 'MENTOR':
            mentor = user
        else:
            mentor = User.objects.filter(academic_profile__role='MENTOR').first() or user
    if not mentee:
        if role == 'MENTEE':
            mentee = user
        else:
            mentee = User.objects.filter(academic_profile__role='MENTEE').first() or user
    return mentor, mentee


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def session_list_create(request):
    if request.method == 'GET':
        qs = _scoped_sessions_for_user(request.user)
        search = (request.query_params.get('search') or '').strip()
        status_filter = (request.query_params.get('status') or '').strip().upper()
        track = (request.query_params.get('track') or '').strip()

        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(session_code__icontains=search)
                | Q(course_or_track__icontains=search)
                | Q(executive_summary__icontains=search)
                | Q(raw_transcript__icontains=search)
            )
        if status_filter in ('SCHEDULED', 'COMPLETED', 'PROCESSED'):
            qs = qs.filter(status=status_filter)
        if track:
            qs = qs.filter(course_or_track__icontains=track)

        return Response(MentoringSessionListSerializer(qs, many=True).data)

    # POST create session
    title = (request.data.get('title') or '').strip()
    if not title:
        return Response({'error': 'Session title is required.'}, status=status.HTTP_400_BAD_REQUEST)

    mentor, mentee = _resolve_mentor_and_mentee(request)
    raw_transcript = request.data.get('raw_transcript', '')
    duration = int(request.data.get('duration_minutes') or 45)
    course_or_track = (request.data.get('course_or_track') or 'Academic Mentoring').strip()
    is_confidential = str(request.data.get('is_confidential', 'false')).lower() in ('1', 'true', 'yes')

    session = MentoringSession.objects.create(
        title=title,
        mentor=mentor,
        mentee=mentee,
        course_or_track=course_or_track,
        duration_minutes=duration,
        raw_transcript=raw_transcript,
        status='COMPLETED' if raw_transcript.strip() else 'SCHEDULED',
        is_confidential=is_confidential,
    )

    if raw_transcript.strip() and str(request.data.get('auto_analyze', 'true')).lower() in ('1', 'true', 'yes'):
        _run_nlp_and_persist(session, replace_actions=True)

    return Response(MentoringSessionDetailSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def session_detail(request, pk: int):
    qs = _scoped_sessions_for_user(request.user)
    session = get_object_or_404(qs, pk=pk)

    if request.method == 'GET':
        return Response(MentoringSessionDetailSerializer(session).data)

    if request.method == 'PATCH':
        for field in ('title', 'course_or_track', 'raw_transcript', 'status', 'duration_minutes', 'is_confidential'):
            if field in request.data:
                setattr(session, field, request.data[field])
        session.save()
        if 'raw_transcript' in request.data and str(request.data.get('reanalyze', 'false')).lower() in ('1', 'true', 'yes'):
            _run_nlp_and_persist(session, replace_actions=True)
        return Response(MentoringSessionDetailSerializer(session).data)

    session.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def session_analyze(request, pk: int):
    """Run or re-run the pure-Python NLP Summarization & Action Extraction workflow."""
    qs = _scoped_sessions_for_user(request.user)
    session = get_object_or_404(qs, pk=pk)

    if 'raw_transcript' in request.data and str(request.data.get('raw_transcript')).strip():
        session.raw_transcript = str(request.data.get('raw_transcript'))
        session.save(update_fields=['raw_transcript'])

    if not session.raw_transcript.strip():
        return Response(
            {'error': 'No transcript found for this session. Provide raw_transcript to analyze.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _run_nlp_and_persist(session, replace_actions=True)
    session.refresh_from_db()
    return Response(MentoringSessionDetailSerializer(session).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def session_quick_analyze(request):
    """Create a new session + parse & summarize pasted text OR uploaded .txt transcript in one step."""
    uploaded_file = request.FILES.get('transcript_file')
    raw_transcript = (request.data.get('raw_transcript') or '').strip()

    if uploaded_file:
        try:
            raw_transcript = uploaded_file.read().decode('utf-8', errors='replace').strip()
        except Exception as exc:
            return Response({'error': f'Unable to read transcript file: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

    if not raw_transcript or len(raw_transcript) < 30:
        return Response(
            {'error': 'Please provide a mentoring transcript of at least 30 characters (paste text or upload .txt).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = (request.data.get('title') or '').strip()
    if not title:
        title = f"Mentoring Session — {datetime.now().strftime('%b %d, %Y')}"

    course_or_track = (request.data.get('course_or_track') or 'Academic Mentoring').strip()
    try:
        duration_minutes = max(5, int(request.data.get('duration_minutes') or 40))
    except (ValueError, TypeError):
        duration_minutes = 40
    is_confidential = str(request.data.get('is_confidential', 'false')).lower() in ('1', 'true', 'yes')

    mentor, mentee = _resolve_mentor_and_mentee(request)

    session = MentoringSession.objects.create(
        title=title,
        mentor=mentor,
        mentee=mentee,
        course_or_track=course_or_track,
        duration_minutes=duration_minutes,
        raw_transcript=raw_transcript,
        status='COMPLETED',
        is_confidential=is_confidential,
    )

    _run_nlp_and_persist(session, replace_actions=True)
    session.refresh_from_db()
    return Response(MentoringSessionDetailSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_document(request, pk: int):
    """Return structured automated Markdown documentation & printable payload."""
    qs = _scoped_sessions_for_user(request.user)
    session = get_object_or_404(qs, pk=pk)

    markdown = _refresh_session_markdown(session)
    return Response({
        'id': session.id,
        'session_code': session.session_code,
        'title': session.title,
        'course_or_track': session.course_or_track,
        'mentor_name': session.mentor.get_full_name() or session.mentor.username,
        'mentee_name': session.mentee.get_full_name() or session.mentee.username,
        'scheduled_at': session.scheduled_at.isoformat(),
        'duration_minutes': session.duration_minutes,
        'is_confidential': session.is_confidential,
        'sentiment_score': session.sentiment_score,
        'engagement_score': session.engagement_score,
        'executive_summary': session.executive_summary,
        'topics': session.topics,
        'key_insights': session.key_insights,
        'decisions': session.decisions,
        'speaker_metrics': session.speaker_metrics,
        'action_items': ActionItemSerializer(session.action_items.all(), many=True).data,
        'markdown': markdown,
        'generated_at': timezone.now().isoformat(),
    })


# ---------------------------------------------------------------------------
# Action Items & Academic Milestones
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def action_item_list_create(request):
    scoped_session_ids = list(_scoped_sessions_for_user(request.user).values_list('id', flat=True))

    if request.method == 'GET':
        qs = ActionItem.objects.filter(session_id__in=scoped_session_ids).select_related('session')
        status_f = (request.query_params.get('status') or '').strip().upper()
        priority_f = (request.query_params.get('priority') or '').strip().upper()
        role_f = (request.query_params.get('assignee_role') or '').strip().upper()
        session_f = request.query_params.get('session')

        if status_f in ('PENDING', 'IN_PROGRESS', 'COMPLETED'):
            qs = qs.filter(status=status_f)
        if priority_f in ('HIGH', 'MEDIUM', 'LOW'):
            qs = qs.filter(priority=priority_f)
        if role_f in ('MENTOR', 'MENTEE'):
            qs = qs.filter(assignee_role=role_f)
        if session_f:
            qs = qs.filter(session_id=session_f)

        return Response(ActionItemSerializer(qs, many=True).data)

    # POST create custom follow-up
    session_id = request.data.get('session')
    description = (request.data.get('description') or '').strip()
    if not session_id or not description:
        return Response({'error': 'Session and description are required.'}, status=status.HTTP_400_BAD_REQUEST)

    session = get_object_or_404(_scoped_sessions_for_user(request.user), pk=session_id)
    assignee_role = (request.data.get('assignee_role') or 'MENTEE').upper()
    if assignee_role not in ('MENTOR', 'MENTEE'):
        assignee_role = 'MENTEE'
    default_name = (
        (session.mentor.get_full_name() or session.mentor.username)
        if assignee_role == 'MENTOR'
        else (session.mentee.get_full_name() or session.mentee.username)
    )
    assignee_name = (request.data.get('assignee_name') or default_name).strip()
    priority = (request.data.get('priority') or 'MEDIUM').upper()
    if priority not in ('HIGH', 'MEDIUM', 'LOW'):
        priority = 'MEDIUM'
    due_label = (request.data.get('due_label') or 'Next Check-in').strip()

    item = ActionItem.objects.create(
        session=session,
        description=description,
        assignee_name=assignee_name,
        assignee_role=assignee_role,
        priority=priority,
        due_label=due_label,
        status='PENDING',
    )
    _refresh_session_markdown(session)
    return Response(ActionItemSerializer(item).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def action_item_detail(request, pk: int):
    scoped_session_ids = list(_scoped_sessions_for_user(request.user).values_list('id', flat=True))
    item = get_object_or_404(ActionItem.objects.select_related('session'), pk=pk, session_id__in=scoped_session_ids)

    if request.method == 'PATCH':
        for field in ('description', 'assignee_name', 'assignee_role', 'priority', 'due_label', 'status'):
            if field in request.data:
                setattr(item, field, request.data[field])
        item.save()
        _refresh_session_markdown(item.session)
        return Response(ActionItemSerializer(item).data)

    session = item.session
    item.delete()
    _refresh_session_markdown(session)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def milestone_list_create(request):
    role = _get_user_role(request.user)
    if request.method == 'GET':
        if role == 'MENTEE':
            qs = SessionMilestone.objects.filter(mentee=request.user).select_related('mentee')
        else:
            qs = SessionMilestone.objects.all().select_related('mentee')
        return Response(SessionMilestoneSerializer(qs, many=True).data)

    title = (request.data.get('title') or '').strip()
    if not title:
        return Response({'error': 'Milestone title is required.'}, status=status.HTTP_400_BAD_REQUEST)

    mentee_id = request.data.get('mentee')
    mentee = User.objects.filter(pk=mentee_id).first() if mentee_id else None
    if not mentee:
        mentee = request.user if role == 'MENTEE' else (User.objects.filter(academic_profile__role='MENTEE').first() or request.user)

    progress = max(0, min(100, int(request.data.get('progress_pct') or 0)))
    category = (request.data.get('category') or 'Academics & Coursework').strip()
    target_date = request.data.get('target_date') or None

    milestone = SessionMilestone.objects.create(
        mentee=mentee,
        title=title,
        category=category,
        progress_pct=progress,
        target_date=target_date,
    )
    return Response(SessionMilestoneSerializer(milestone).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def milestone_detail(request, pk: int):
    role = _get_user_role(request.user)
    qs = SessionMilestone.objects.filter(mentee=request.user) if role == 'MENTEE' else SessionMilestone.objects.all()
    milestone = get_object_or_404(qs, pk=pk)

    if request.method == 'PATCH':
        if 'title' in request.data:
            milestone.title = str(request.data['title']).strip()
        if 'category' in request.data:
            milestone.category = str(request.data['category']).strip()
        if 'progress_pct' in request.data:
            milestone.progress_pct = max(0, min(100, int(request.data['progress_pct'])))
        if 'target_date' in request.data:
            milestone.target_date = request.data['target_date'] or None
        milestone.save()
        return Response(SessionMilestoneSerializer(milestone).data)

    milestone.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
