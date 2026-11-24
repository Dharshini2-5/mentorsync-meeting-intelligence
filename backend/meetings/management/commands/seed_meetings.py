"""
Idempotent management command to seed MentorSync AI with realistic
mentor-mentee academic users, 6 multi-turn recorded session transcripts
processed through the live pure-Python NLP summarization engine, and milestones.
"""
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from meetings.models import AcademicProfile, ActionItem, MentoringSession, SessionMilestone
from meetings.nlp_summarizer import analyze_transcript


USERS_SEED = [
    {
        'email': 'mentor@mentorsync.edu',
        'password': 'Mentor@123',
        'first_name': 'Dr. Anitha',
        'last_name': 'Raman',
        'role': 'MENTOR',
        'department': 'Electronics & Communication Engineering',
        'academic_id': 'AU-FAC-ECE-108',
        'specialization': 'NLP, Intelligent Systems & Embedded AI',
        'cgpa': None,
        'avatar_color': '#6366F1',
    },
    {
        'email': 'dharshini@mentorsync.edu',
        'password': 'Mentee@123',
        'first_name': 'Dharshini',
        'last_name': 'A',
        'role': 'MENTEE',
        'department': 'B.E. Electronics & Communication Engineering',
        'academic_id': 'AU-ECE-2026-014',
        'specialization': 'Full-Stack AI, Django & Data Analytics',
        'cgpa': 8.2,
        'avatar_color': '#14B8A6',
    },
    {
        'email': 'coordinator@mentorsync.edu',
        'password': 'Coord@123',
        'first_name': 'Prof. Rajesh',
        'last_name': 'Subramanian',
        'role': 'COORDINATOR',
        'department': 'Academic Mentoring Cell — Anna University',
        'academic_id': 'AU-CRD-001',
        'specialization': 'Academic Quality & Placement Governance',
        'cgpa': None,
        'avatar_color': '#FB923C',
    },
    {
        'email': 'karthik@mentorsync.edu',
        'password': 'Mentee@123',
        'first_name': 'Karthik',
        'last_name': 'Sundaram',
        'role': 'MENTEE',
        'department': 'B.E. Electronics & Communication Engineering',
        'academic_id': 'AU-ECE-2026-029',
        'specialization': 'IoT Edge Firmware & VLSI Design',
        'cgpa': 8.5,
        'avatar_color': '#38BDF8',
    },
    {
        'email': 'priya@mentorsync.edu',
        'password': 'Mentee@123',
        'first_name': 'Priya',
        'last_name': 'Nair',
        'role': 'MENTEE',
        'department': 'B.E. Electronics & Communication Engineering',
        'academic_id': 'AU-ECE-2026-041',
        'specialization': 'Signal Processing & Machine Learning',
        'cgpa': 8.7,
        'avatar_color': '#A855F7',
    },
]


SESSIONS_SEED = [
    {
        'session_code': 'MS-2026-001',
        'title': 'Mid-Semester Academic Performance & Lab Review',
        'mentee_email': 'dharshini@mentorsync.edu',
        'course_or_track': 'Semester VII — Core ECE & Lab Review',
        'days_ago': 38,
        'duration_minutes': 40,
        'is_confidential': True,
        'completed_action_indices': [0, 1, 2],
        'transcript': """Dr. Anitha Raman [00:00:15]: Good afternoon Dharshini! Let's review your mid-semester internal assessment marks and your VLSI and DSP lab progress so far.
Dharshini A [00:01:02]: Good afternoon ma'am. Overall my CGPA is holding steady at 8.2, and I scored 91 percent in Embedded Systems and 88 in Digital Signal Processing. However, I am slightly struggling with timing constraints in the VLSI lab viva and missed one practice benchmark due to schedule clashes with placement prep.
Dr. Anitha Raman [00:02:20]: That's very strong core performance, and catching the VLSI timing bottleneck early is the right move. How are you currently structuring your weekly study schedule between coursework exams and coding preparation?
Dharshini A [00:03:18]: Honestly, my time management was a bit scattered last week because two lab deadlines overlapped with a mock aptitude test. I feel I need a stricter weekly routine so neither internals nor placement practice gets delayed.
Dr. Anitha Raman [00:04:45]: We decided to adopt a blocked time management schedule: dedicate weekday mornings strictly to core ECE coursework and lab theory, and reserve 7 PM to 9 PM for coding and project sprints. Let's also lock in a target CGPA of 8.5 for this semester.
Dharshini A [00:06:05]: That structure sounds super clear and achievable! I will revise the static timing analysis modules and solve all five past VLSI lab viva sheets by Friday.
Dr. Anitha Raman [00:07:10]: Excellent. Please also compile your DSP filter simulation plots and submit the clean lab observation report before Monday afternoon.
Dharshini A [00:08:02]: Done ma'am, I'll upload the lab observation report before Monday afternoon and share my updated weekly timetable tomorrow.
Dr. Anitha Raman [00:08:50]: I will review your timetable and share our department's curated VLSI internal exam question bank by Wednesday. Keep up the great momentum — you are well positioned for a strong semester.""",
    },
    {
        'session_code': 'MS-2026-002',
        'title': 'DSA & Placement Readiness Sprint Check-in',
        'mentee_email': 'dharshini@mentorsync.edu',
        'course_or_track': 'Career & Technical Placement Readiness',
        'days_ago': 29,
        'duration_minutes': 45,
        'is_confidential': False,
        'completed_action_indices': [0, 1],
        'transcript': """Dr. Anitha Raman [00:00:20]: Welcome back Dharshini. Let's evaluate your DSA and placement sprint progress from the last two weeks — how did the timed LeetCode mock tests go?
Dharshini A [00:01:12]: Thank you ma'am! I solved 38 problems across arrays, sliding window, binary search, and trees, and my accuracy in timed contests improved from 60 percent to 82 percent. My main bottleneck right now is dynamic programming and shortest-path graph algorithms under 45-minute interview pressure.
Dr. Anitha Raman [00:02:35]: An improvement to 82 percent accuracy is impressive progress. When you get stuck on dynamic programming problems, is the issue state formulation or recognizing the recurrence pattern?
Dharshini A [00:03:28]: Usually defining the state transitions cleanly before coding. Also, I refreshed my resume to highlight my Django backend and SQL analytics projects, and I want to make sure it passes ATS screening for top SDE roles.
Dr. Anitha Raman [00:04:55]: Let's prioritize structured pattern drilling rather than random questions. We agreed to focus the next two weeks on 20 curated dynamic programming patterns and 15 graph traversal problems, plus two SQL query optimization drills.
Dharshini A [00:06:10]: That makes total sense! I will complete the 10 foundational knapsack and subsequence DP problems on LeetCode by Friday evening.
Dr. Anitha Raman [00:07:05]: Make sure you write down the time and space complexity notes for every problem in your GitHub interview prep repository within 3 days. Please also send your updated one-page ATS resume PDF by Tuesday so we can refine the impact metrics together.
Dharshini A [00:08:15]: I'll push my complexity notes to GitHub within 3 days and email my resume draft by Tuesday morning.
Dr. Anitha Raman [00:09:00]: Great! I will review your resume bullet points and schedule a behavioral STAR method mock interview with our alumni mentor next week. You are building strong placement readiness!""",
    },
    {
        'session_code': 'MS-2026-003',
        'title': 'NLP Research Paper Literature Review',
        'mentee_email': 'dharshini@mentorsync.edu',
        'course_or_track': 'IEEE Research Track — Meeting Summarization NLP',
        'days_ago': 21,
        'duration_minutes': 50,
        'is_confidential': False,
        'completed_action_indices': [0, 1],
        'transcript': """Dr. Anitha Raman [00:00:18]: Hello Dharshini, let's dive into your IEEE conference research paper literature survey on extractive meeting summarization for academic conversations. What baselines have you compared so far?
Dharshini A [00:01:25]: Hello ma'am! I surveyed 18 recent papers from ACL and IEEE Transactions comparing TextRank, TF-IDF graph centrality, LexRank, and lightweight transformer models on the AMI and ICSI meeting corpora. One key takeaway is that pure statistical graph methods lose accuracy when transcripts contain heavy conversational filler unless we apply discourse-marker weighting and MMR deduplication.
Dr. Anitha Raman [00:03:10]: That is a sharp research insight and gives your paper a clear methodological contribution! Have you measured the ROUGE-1 and F1 baseline scores on your annotated mentor-mentee evaluation dataset?
Dharshini A [00:04:12]: Yes ma'am, our TextRank plus discourse boost prototype achieved 0.74 ROUGE-1 and 0.81 action-item precision, outperforming vanilla TF-IDF by 11 percent. However, the ablation study table is still incomplete and my LaTeX citations need IEEE bibliography formatting.
Dr. Anitha Raman [00:05:40]: Those experimental numbers are very promising for an undergraduate IEEE manuscript. We decided to include three ablation experiments in Section IV: baseline TF-IDF, TextRank without MMR, and our full discourse-weighted hybrid pipeline.
Dharshini A [00:06:50]: Agreed! I will run the complete ablation experiments and generate the precision-recall comparison chart by Thursday.
Dr. Anitha Raman [00:07:45]: Please draft the structured abstract, methodology diagram, and LaTeX reference section by next Monday so we stay ahead of the IEEE conference submission deadline.
Dharshini A [00:08:40]: I'll finalize the LaTeX manuscript draft and verify all 18 IEEE citations by next Monday.
Dr. Anitha Raman [00:09:30]: I will review your methodology section and provide detailed peer-review comments within 2 days of receiving the draft. This is shaping up to be an excellent publication.""",
    },
    {
        'session_code': 'MS-2026-004',
        'title': 'IoT & Embedded Systems Prototype Demo',
        'mentee_email': 'karthik@mentorsync.edu',
        'course_or_track': 'Hardware-Software Co-Design Capstone',
        'days_ago': 15,
        'duration_minutes': 45,
        'is_confidential': False,
        'completed_action_indices': [0],
        'transcript': """Dr. Anitha Raman [00:00:12]: Hi Karthik! I am excited to see the live demo of your ESP32 edge telemetry prototype and MQTT ingestion pipeline. Walk me through the current hardware stability.
Karthik Sundaram [00:01:05]: Good morning ma'am! The ESP32 firmware now samples temperature, vibration, and current sensors at 50 Hz and streams JSON packets over MQTT to our Django dashboard with under 180 ms latency. One concern is occasional Wi-Fi packet drop during high-load stress tests and minor analog sensor drift after 30 minutes.
Dr. Anitha Raman [00:02:40]: Sub-200 ms end-to-end latency is a solid engineering milestone. What is causing the Wi-Fi disconnect — power supply ripple on the ESP32 rail or MQTT keep-alive timeouts?
Karthik Sundaram [00:03:35]: Good catch ma'am — oscilloscope traces showed voltage dips when the Wi-Fi radio transmits bursts, plus we had no local ring buffer for offline retries.
Dr. Anitha Raman [00:04:55]: We finalized two architecture upgrades: add a 470 microfarad decoupling capacitor on the 3.3V power rail and implement a circular SRAM telemetry buffer with exponential backoff reconnect in the firmware.
Karthik Sundaram [00:06:10]: That will make the hardware rock solid! I will solder the decoupling capacitor and calibrate the ADC sensor offset using a moving-average filter by Wednesday.
Dr. Anitha Raman [00:07:05]: Please also benchmark a continuous 4-hour soak test and document the packet loss rate before Friday.
Karthik Sundaram [00:07:55]: I'll run the 4-hour soak test and upload the hardware validation logs by Friday evening.
Dr. Anitha Raman [00:08:45]: I will coordinate with the lab technician to reserve the spectrum analyzer and bench power supply for your validation run tomorrow.""",
    },
    {
        'session_code': 'MS-2026-005',
        'title': 'Final Year Capstone Architecture Review',
        'mentee_email': 'dharshini@mentorsync.edu',
        'course_or_track': 'Final Year Capstone — MentorSync AI Platform',
        'days_ago': 8,
        'duration_minutes': 55,
        'is_confidential': False,
        'completed_action_indices': [0],
        'transcript': """Dr. Anitha Raman [00:00:15]: Welcome Dharshini! Today is our critical Capstone Architecture Review for MentorSync AI — your Django-based Smart Meeting Intelligence System. How is the backend API and NLP pipeline integration coming along?
Dharshini A [00:01:18]: Thank you ma'am! The Django REST Framework backend and HS256 JWT authentication layer are now working cleanly with role-based access for Mentors, Mentees, and Academic Coordinators. Our pure-Python TextRank and TF-IDF summarization engine parses multi-speaker transcripts in under 40 milliseconds and extracts executive summaries, discussion insights, decisions, and actionable follow-ups automatically.
Dr. Anitha Raman [00:03:05]: Under 40 milliseconds with zero heavy external dependency headaches is genuinely clean engineering! How are you handling automated academic documentation and dashboard responsiveness for faculty reviewers?
Dharshini A [00:04:15]: I designed an automated Markdown academic minutes generator that compiles metadata, sentiment and engagement scores, topic clusters, and live action-item tables with one-click copy, Markdown download, and PDF print support. On the frontend, I am building a high-contrast React and Tailwind dashboard with interactive Recharts visualizations and browser Speech-to-Text live transcript capture.
Dr. Anitha Raman [00:05:50]: That solves a real institutional pain point in academic mentoring documentation. We decided to enforce confidential session flags on sensitive mid-semester counseling records and expose anonymized aggregate stats for the public portal landing page.
Dharshini A [00:07:02]: Agreed! Let's also make sure the action-item status tracker syncs directly back into the generated Markdown documentation whenever a follow-up is marked completed.
Dr. Anitha Raman [00:07:55]: Absolutely — live document synchronization will impress the capstone jury. Please complete end-to-end API testing for JWT auth, quick-analyze file uploads, and milestone progress tracking by Friday.
Dharshini A [00:08:50]: I will write the end-to-end verification tests and polish the responsive dashboard UX by Friday. I'll also prepare the 8-slide capstone architecture deck and system sequence diagram before next Tuesday's demo.
Dr. Anitha Raman [00:09:45]: I will review your architecture slides and invite our department Coordinator to attend the dry-run demonstration next Wednesday. Fantastic engineering execution, Dharshini!""",
    },
    {
        'session_code': 'MS-2026-006',
        'title': 'System Design Mock & Interview Prep',
        'mentee_email': 'dharshini@mentorsync.edu',
        'course_or_track': 'Placement Readiness — System Design & Behavioral',
        'days_ago': 2,
        'duration_minutes': 50,
        'is_confidential': False,
        'completed_action_indices': [],
        'transcript': """Dr. Anitha Raman [00:00:10]: Good morning Dharshini! Let's debrief your System Design mock interview where you architected a real-time academic notification and meeting analytics platform. How did you feel about your walkthrough?
Dharshini A [00:01:12]: Good morning ma'am! I felt confident defining the API contracts, database indexing strategy, and JWT security boundaries, and I explained read-heavy caching clearly. My main gap was estimating peak write throughput quickly and articulating how to prevent duplicate webhook processing under network retries.
Dr. Anitha Raman [00:02:45]: Your structured requirement gathering and schema design were super clear — that already puts you ahead of most campus candidates. For back-of-the-envelope capacity estimation and idempotency keys, a concise 3-step template will eliminate hesitation during technical rounds.
Dharshini A [00:03:55]: That sounds very helpful! Also, in the behavioral round, I noticed I sometimes rush through the measurable outcomes of my projects instead of framing them cleanly with the STAR method.
Dr. Anitha Raman [00:05:10]: Great self-awareness! We decided to craft four high-impact STAR stories covering your Smart Meeting Intelligence capstone, Placement Readiness Analytics, Embedded IoT work, and cross-team debugging leadership.
Dharshini A [00:06:20]: I will practice capacity estimation drills and design two end-to-end systems — a rate limiter and a distributed task scheduler — by Thursday.
Dr. Anitha Raman [00:07:15]: Please also draft your four STAR behavioral stories with quantified latency and accuracy metrics and share them before Saturday's mock panel.
Dharshini A [00:08:10]: I'll finalize my STAR behavioral playbook and record a 2-minute self-introduction pitch before Saturday.
Dr. Anitha Raman [00:09:05]: I will conduct a final 30-minute technical and HR rapid-fire mock interview next Monday morning. Your confidence and technical depth have grown tremendously — you are ready for placement drives!""",
    },
]


MILESTONES_SEED = [
    {
        'mentee_email': 'dharshini@mentorsync.edu',
        'title': 'Complete Capstone System Architecture & Live Demo',
        'category': 'Project Architecture',
        'progress_pct': 88,
        'days_from_now': 14,
    },
    {
        'mentee_email': 'dharshini@mentorsync.edu',
        'title': 'Solve 150 Curated DSA & Dynamic Programming Problems',
        'category': 'DSA & Coding Prep',
        'progress_pct': 76,
        'days_from_now': 21,
    },
    {
        'mentee_email': 'dharshini@mentorsync.edu',
        'title': 'Submit IEEE Conference Paper on Meeting NLP Summarization',
        'category': 'Research & Paper Writing',
        'progress_pct': 68,
        'days_from_now': 30,
    },
    {
        'mentee_email': 'dharshini@mentorsync.edu',
        'title': 'Target 8.5+ Semester CGPA & VLSI Lab Excellence',
        'category': 'Academics & Coursework',
        'progress_pct': 84,
        'days_from_now': 45,
    },
    {
        'mentee_email': 'dharshini@mentorsync.edu',
        'title': 'Complete 5 System Design & Behavioral Mock Interviews',
        'category': 'Career & Placement',
        'progress_pct': 80,
        'days_from_now': 18,
    },
    {
        'mentee_email': 'karthik@mentorsync.edu',
        'title': 'Pass 4-Hour ESP32 Telemetry Hardware Soak Test',
        'category': 'Project Architecture',
        'progress_pct': 72,
        'days_from_now': 12,
    },
]


class Command(BaseCommand):
    help = 'Idempotently seed MentorSync AI with demo users, NLP-processed sessions, action items, and milestones.'

    def handle(self, *args, **options):
        users_by_email: dict[str, User] = {}

        for u_data in USERS_SEED:
            user, created = User.objects.get_or_create(
                username=u_data['email'],
                defaults={
                    'email': u_data['email'],
                    'first_name': u_data['first_name'],
                    'last_name': u_data['last_name'],
                },
            )
            if created:
                user.set_password(u_data['password'])
                user.save()
            else:
                # Ensure profile fields stay accurate without destroying password changes unless missing
                if not user.check_password(u_data['password']):
                    user.set_password(u_data['password'])
                    user.save()

            AcademicProfile.objects.update_or_create(
                user=user,
                defaults={
                    'role': u_data['role'],
                    'department': u_data['department'],
                    'academic_id': u_data['academic_id'],
                    'specialization': u_data['specialization'],
                    'cgpa': u_data['cgpa'],
                    'avatar_color': u_data['avatar_color'],
                },
            )
            users_by_email[u_data['email']] = user

        mentor = users_by_email['mentor@mentorsync.edu']
        now = timezone.now()
        created_sessions = 0

        for s_data in SESSIONS_SEED:
            if MentoringSession.objects.filter(session_code=s_data['session_code']).exists():
                continue

            mentee = users_by_email[s_data['mentee_email']]
            scheduled_at = now - timedelta(days=s_data['days_ago'])

            result = analyze_transcript(
                s_data['transcript'],
                session_code=s_data['session_code'],
                title=s_data['title'],
                mentor_name=mentor.get_full_name(),
                mentee_name=mentee.get_full_name(),
                course_or_track=s_data['course_or_track'],
                scheduled_at=scheduled_at,
                duration_minutes=s_data['duration_minutes'],
                is_confidential=s_data['is_confidential'],
            )

            session = MentoringSession.objects.create(
                session_code=s_data['session_code'],
                title=s_data['title'],
                mentor=mentor,
                mentee=mentee,
                course_or_track=s_data['course_or_track'],
                scheduled_at=scheduled_at,
                duration_minutes=s_data['duration_minutes'],
                status='PROCESSED',
                raw_transcript=s_data['transcript'],
                executive_summary=result['executive_summary'],
                key_insights=result['key_insights'],
                decisions=result['decisions'],
                topics=result['topics'],
                speaker_metrics=result['speaker_metrics'],
                sentiment_score=result['sentiment_score'],
                engagement_score=result['engagement_score'],
                generated_markdown_doc=result['generated_markdown_doc'],
                is_confidential=s_data['is_confidential'],
            )

            completed_set = set(s_data.get('completed_action_indices', []))
            for idx, item in enumerate(result['action_items']):
                if idx in completed_set:
                    item_status = 'COMPLETED'
                elif idx == len(completed_set) and s_data['days_ago'] < 25:
                    item_status = 'IN_PROGRESS'
                else:
                    item_status = 'PENDING'

                ActionItem.objects.create(
                    session=session,
                    description=item['description'],
                    assignee_name=item['assignee_name'],
                    assignee_role=item['assignee_role'],
                    priority=item['priority'],
                    due_label=item['due_label'],
                    status=item_status,
                )

            created_sessions += 1

        today = date.today()
        created_milestones = 0
        for m_data in MILESTONES_SEED:
            mentee = users_by_email[m_data['mentee_email']]
            _, created = SessionMilestone.objects.get_or_create(
                mentee=mentee,
                title=m_data['title'],
                defaults={
                    'category': m_data['category'],
                    'progress_pct': m_data['progress_pct'],
                    'target_date': today + timedelta(days=m_data['days_from_now']),
                },
            )
            if created:
                created_milestones += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"MentorSync AI seed complete: {len(users_by_email)} users ready, "
                f"{created_sessions} new sessions analyzed via NLP, "
                f"{created_milestones} new milestones created "
                f"(total sessions: {MentoringSession.objects.count()}, "
                f"total action items: {ActionItem.objects.count()})."
            )
        )
