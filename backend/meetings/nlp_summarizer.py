"""
Pure-Python NLP Summarization & Conversation Intelligence Engine for MentorSync AI.

Zero C/Rust extensions required (100% Python stdlib) — engineered specifically for
academic mentor-mentee recorded conversation transcripts:
  1. Multi-speaker transcript parser (timestamps, speaker turns, role mapping)
  2. Graph-based TextRank + TF-IDF Extractive Summarizer with MMR diversity
  3. Academic Topic Clustering & Structured Discussion Insights
  4. Decision Extractor & Actionable Follow-Up Extractor (owner, role, priority, due date)
  5. Speaker Talk-Time, Question Density, Sentiment & Engagement Analytics
  6. Automated Academic Meeting Minutes Markdown Generator
"""
from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

# ---------------------------------------------------------------------------
# Lexical Resources
# ---------------------------------------------------------------------------

STOPWORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an',
    'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
    'below', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
    'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'get',
    'got', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
    'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
    'itself', 'just', 'let', 'like', 'll', 'ma', 'me', 'might', 'more', 'most',
    'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
    'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 're', 's',
    'same', 'she', 'should', 'so', 'some', 'such', 't', 'than', 'that', 'the',
    'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 've', 'very',
    'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
    'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
    # Conversational fillers
    'yeah', 'yes', 'okay', 'ok', 'sure', 'actually', 'basically', 'right', 'well',
    'um', 'uh', 'hmm', 'thank', 'thanks', 'hello', 'hi', 'good', 'morning',
    'afternoon', 'evening', 'maam', 'mam', 'sir', 'please', 'great', 'sounds',
    'definitely', 'absolutely', 'really', 'pretty', 'kind', 'sort', 'thing',
    'things', 'going', 'want', 'think', 'know', 'see', 'look', 'make', 'take',
}

DISCOURSE_BOOST_MARKERS = {
    'decided': 1.45,
    'decision': 1.40,
    'agreed': 1.38,
    'conclusion': 1.45,
    'key takeaway': 1.50,
    'takeaway': 1.40,
    'milestone': 1.35,
    'goal': 1.30,
    'target': 1.28,
    'priority': 1.35,
    'critical': 1.32,
    'bottleneck': 1.35,
    'architecture': 1.25,
    'benchmark': 1.28,
    'achieved': 1.30,
    'completed': 1.25,
    'strategy': 1.28,
    'recommend': 1.30,
    'finalized': 1.42,
    'approved': 1.38,
    'focus': 1.22,
    'deadline': 1.30,
    'summary': 1.40,
    'overall': 1.25,
    'next step': 1.35,
    'action item': 1.38,
    'improve': 1.22,
    'accuracy': 1.25,
    'latency': 1.25,
    'prototype': 1.25,
    'placement': 1.25,
    'cgpa': 1.25,
}

TOPIC_CLUSTERS = {
    'Academics & Coursework': {
        'color': '#38BDF8',
        'keywords': {
            'exam': 2.2, 'exams': 2.2, 'cgpa': 2.6, 'semester': 2.0, 'lab': 2.0,
            'labs': 2.0, 'syllabus': 2.2, 'lecture': 1.6, 'marks': 2.0, 'assignment': 1.8,
            'viva': 2.3, 'internals': 2.4, 'internal': 1.8, 'coursework': 2.5, 'credit': 1.6,
            'grade': 2.0, 'grades': 2.0, 'ece': 1.8, 'vlsi': 2.3, 'dsp': 2.2,
            'signals': 1.8, 'theory': 1.6, 'attendance': 1.8, 'midterm': 2.3, 'quiz': 1.6,
            'subject': 1.5, 'subjects': 1.5, 'faculty': 1.4, 'score': 1.3,
        },
    },
    'DSA & Coding Prep': {
        'color': '#14B8A6',
        'keywords': {
            'dsa': 3.0, 'leetcode': 2.8, 'algorithm': 2.2, 'algorithms': 2.2, 'graph': 2.0,
            'graphs': 2.0, 'dynamic programming': 3.0, 'dp': 2.4, 'tree': 1.8, 'trees': 1.8,
            'array': 1.6, 'complexity': 2.0, 'coding': 2.2, 'python': 1.7, 'sql': 2.0,
            'recursion': 2.2, 'binary search': 2.5, 'mock test': 2.2, 'competitive': 1.8,
            'problem solving': 2.2, 'backtracking': 2.4, 'heap': 2.0, 'trie': 2.2,
            'sliding window': 2.4, 'two pointers': 2.3, 'timed': 1.5, 'contest': 1.8,
            'code': 1.3, 'debugging': 1.6,
        },
    },
    'Project Architecture': {
        'color': '#6366F1',
        'keywords': {
            'architecture': 2.6, 'django': 2.4, 'react': 2.3, 'api': 2.2, 'apis': 2.2,
            'database': 2.2, 'backend': 2.2, 'frontend': 2.0, 'prototype': 2.4,
            'deployment': 2.2, 'pipeline': 2.2, 'docker': 2.3, 'schema': 2.2,
            'microservice': 2.4, 'latency': 2.2, 'throughput': 2.0, 'sensor': 2.2,
            'sensors': 2.2, 'iot': 2.6, 'esp32': 2.6, 'embedded': 2.5, 'firmware': 2.5,
            'dashboard': 2.0, 'jwt': 2.2, 'rest': 1.9, 'mqtt': 2.4, 'hardware': 2.2,
            'capstone': 2.3, 'system': 1.5, 'module': 1.7, 'integration': 2.0,
            'telemetry': 2.2, 'caching': 2.1, 'redis': 2.2, 'indexing': 2.0,
        },
    },
    'Research & Paper Writing': {
        'color': '#A855F7',
        'keywords': {
            'paper': 2.4, 'ieee': 2.8, 'literature': 2.6, 'survey': 2.0, 'dataset': 2.3,
            'datasets': 2.3, 'citation': 2.4, 'citations': 2.4, 'abstract': 2.5,
            'methodology': 2.5, 'experiment': 2.2, 'experiments': 2.2, 'accuracy': 2.2,
            'evaluation': 2.0, 'nlp': 2.5, 'model': 1.8, 'conference': 2.4, 'journal': 2.4,
            'latex': 2.6, 'manuscript': 2.6, 'hypothesis': 2.4, 'baseline': 2.3,
            'rouge': 2.6, 'f1': 2.2, 'ablation': 2.7, 'transformer': 2.3, 'summarization': 2.4,
            'publication': 2.5, 'research': 2.3, 'corpus': 2.4,
        },
    },
    'Career & Placement': {
        'color': '#FB923C',
        'keywords': {
            'placement': 2.8, 'placements': 2.8, 'interview': 2.5, 'interviews': 2.5,
            'resume': 2.6, 'internship': 2.5, 'recruiter': 2.4, 'company': 1.8,
            'companies': 1.8, 'system design': 2.8, 'portfolio': 2.4, 'github': 2.0,
            'behavioral': 2.4, 'offer': 2.2, 'mock interview': 2.8, 'ats': 2.5,
            'linkedin': 2.2, 'soft skills': 2.2, 'aptitude': 2.2, 'career': 2.3,
            'hiring': 2.3, 'star method': 2.6, 'hr': 2.0, 'technical round': 2.6,
            'role': 1.4, 'engineer': 1.5, 'sde': 2.5,
        },
    },
    'Time Management & Blockers': {
        'color': '#F43F5E',
        'keywords': {
            'blocker': 2.8, 'blockers': 2.8, 'stuck': 2.3, 'schedule': 2.0,
            'deadline': 2.2, 'deadlines': 2.2, 'bandwidth': 2.4, 'stress': 2.3,
            'overdue': 2.5, 'time management': 2.8, 'sprint': 2.0, 'backlog': 2.3,
            'balance': 1.9, 'clash': 2.2, 'delay': 2.2, 'delayed': 2.2,
            'dependency': 2.2, 'risk': 2.0, 'focus': 1.6, 'routine': 2.0,
            'burnout': 2.6, 'pomodoro': 2.4, 'calendar': 1.8, 'overwhelmed': 2.5,
            'bottleneck': 2.5, 'issue': 1.5, 'troubleshoot': 1.9, 'failing': 2.0,
        },
    },
}

POSITIVE_LEXICON = {
    'great': 1.2, 'excellent': 1.6, 'impressive': 1.6, 'improved': 1.4, 'improving': 1.3,
    'improvement': 1.4, 'clear': 1.1, 'confident': 1.5, 'achieved': 1.6, 'achieve': 1.2,
    'progress': 1.4, 'solid': 1.3, 'resolved': 1.5, 'excited': 1.4, 'ready': 1.2,
    'strong': 1.3, 'clean': 1.1, 'effective': 1.3, 'efficient': 1.3, 'smooth': 1.2,
    'helpful': 1.3, 'appreciate': 1.3, 'well': 0.8, 'good': 1.0, 'better': 1.2,
    'best': 1.4, 'success': 1.5, 'successful': 1.5, 'passed': 1.4, 'accurate': 1.3,
    'stable': 1.2, 'optimized': 1.4, 'fast': 1.1, 'completed': 1.4, 'finished': 1.3,
    'consistent': 1.3, 'structured': 1.2, 'promising': 1.4, 'proud': 1.5,
    'encouraging': 1.4, 'productive': 1.4, 'aligned': 1.2, 'approved': 1.4,
    'happy': 1.3, 'fantastic': 1.6, 'brilliant': 1.6, 'wonderful': 1.5, 'sharp': 1.2,
    'mastered': 1.6, 'solved': 1.4, 'validated': 1.3, 'ahead': 1.2, 'outperformed': 1.6,
}

CONCERN_LEXICON = {
    'struggling': 1.5, 'struggle': 1.4, 'stuck': 1.4, 'behind': 1.3, 'confused': 1.4,
    'confusing': 1.3, 'failing': 1.6, 'failed': 1.5, 'fail': 1.5, 'delayed': 1.4,
    'delay': 1.3, 'risk': 1.1, 'bottleneck': 1.3, 'worried': 1.4, 'worry': 1.3,
    'difficult': 1.1, 'hard': 0.8, 'issue': 1.0, 'issues': 1.1, 'error': 1.2,
    'errors': 1.2, 'bug': 1.2, 'bugs': 1.2, 'low': 1.0, 'weak': 1.3, 'slow': 1.1,
    'overwhelmed': 1.6, 'stress': 1.4, 'stressed': 1.5, 'burnout': 1.7, 'blocker': 1.4,
    'blockers': 1.4, 'missed': 1.3, 'missing': 1.2, 'gap': 1.1, 'gaps': 1.1,
    'unstable': 1.4, 'crash': 1.5, 'crashed': 1.5, 'drop': 1.1, 'dropped': 1.2,
    'overdue': 1.5, 'tight': 0.9, 'problem': 1.1, 'problems': 1.2, 'concern': 1.2,
    'unclear': 1.2, 'incomplete': 1.3, 'noisy': 1.1, 'drift': 1.1, 'timeout': 1.3,
}

NEGATORS = {'not', 'no', 'never', "don't", "didn't", "isn't", "aren't", "won't", "can't", 'without', 'hardly'}

DECISION_PATTERNS = [
    r'\b(?:we\s+)?decided\s+(?:to|that|on)\b',
    r'\bdecision\s+(?:is|was)\b',
    r"\blet'?s\s+(?:go\s+with|lock\s+in|finalize|adopt|switch\s+to|stick\s+with|prioritize|use|target)\b",
    r'\b(?:we\s+)?agreed\s+(?:to|that|on)\b',
    r'\bfinalized\b',
    r'\bapproved\b',
    r'\bconfirmed\s+(?:that|to)\b',
    r'\bwe\s+will\s+(?:use|adopt|switch|keep|focus|prioritize|target|present|submit)\b',
    r'\bplan\s+is\s+to\b',
    r'\bconsensus\s+is\b',
    r'\bgoing\s+forward,?\s+we\b',
    r'\bsettled\s+on\b',
    r'\bmoving\s+forward\s+with\b',
]

ACTION_COMMITMENT_PATTERNS = [
    r"\b(?:i\s+will|i'll|i\s+am\s+going\s+to|i'm\s+going\s+to|i\s+need\s+to|i\s+plan\s+to)\s+(.+)",
    r"\b(?:you\s+should|you\s+need\s+to|please|make\s+sure\s+(?:you\s+)?(?:to\s+)?|can\s+you|could\s+you|try\s+to)\s+(.+)",
    r"\baction\s+item\s*[:\-]?\s*(.+)",
    r"\bfollow[\s\-]up\s*[:\-]?\s*(.+)",
    r"\b(?:we\s+need\s+to|we\s+should|let'?s\s+make\s+sure\s+to)\s+(.+)",
]

ACTION_STRONG_VERBS = {
    'implement', 'build', 'create', 'write', 'draft', 'prepare', 'review', 'complete',
    'finish', 'submit', 'send', 'share', 'schedule', 'fix', 'refactor', 'optimize',
    'solve', 'practice', 'test', 'benchmark', 'validate', 'update', 'document',
    'design', 'integrate', 'deploy', 'calibrate', 'collect', 'analyze', 'upload',
    'revise', 'polish', 'add', 'configure', 'verify', 'run', 'compare', 'push',
    'record', 'compile', 'outline', 'summarize', 'debug', 'measure', 'attend',
}

DUE_PATTERNS = [
    r'\b(by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening|night|eod))?)\b',
    r'\b(before\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?)\b',
    r'\b(by\s+(?:end\s+of\s+(?:this\s+|the\s+)?(?:week|month|day)|eod|tomorrow|tonight|this\s+weekend|next\s+week))\b',
    r'\b(within\s+\d+\s+(?:days?|hours?|weeks?))\b',
    r'\b(in\s+the\s+next\s+\d+\s+(?:days?|weeks?))\b',
    r'\b(by\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?)\b',
    r'\b(before\s+(?:the\s+)?next\s+(?:session|check-?in|meeting|review|sprint|lab|viva|mock))\b',
    r'\b(this\s+weekend|next\s+week|tomorrow|by\s+friday|by\s+next\s+(?:monday|tuesday|wednesday|thursday|friday))\b',
]

HIGH_PRIORITY_CUES = {
    'urgent', 'critical', 'asap', 'immediately', 'crucial', 'must', 'blocker',
    'exam', 'viva', 'submission', 'deadline', 'tomorrow', 'tonight', 'eod',
    'before', 'priority', 'essential', 'mandatory', 'failing', 'crash',
}

LOW_PRIORITY_CUES = {
    'optional', 'eventually', 'when time permits', 'nice to have', 'bonus',
    'explore', 'later', 'if possible', 'stretch goal',
}


# ---------------------------------------------------------------------------
# Text Helpers
# ---------------------------------------------------------------------------

def _normalize_token(word: str) -> str:
    """Lightweight suffix stemmer so inflected academic terms align in TF-IDF."""
    w = word.lower()
    if len(w) <= 3:
        return w
    for suffix in ('ingly', 'edly', 'ation', 'ition', 'ments', 'ment', 'ness', 'ings', 'ing', 'ied', 'ies', 'ed', 'es', 's'):
        if w.endswith(suffix) and len(w) - len(suffix) >= 3:
            if suffix == 'ies':
                return w[:-3] + 'y'
            if suffix == 'ied':
                return w[:-3] + 'y'
            return w[:-len(suffix)]
    return w


def _tokenize(text: str) -> list[str]:
    raw = re.findall(r"[a-zA-Z0-9][a-zA-Z0-9\+\#\-]*", text.lower())
    return [_normalize_token(tok) for tok in raw if tok not in STOPWORDS and len(tok) > 1]


def _split_sentences(text: str) -> list[str]:
    # Protect common honorifics/abbreviations like Dr., Prof., Mr., Ms., e.g., i.e., vs.
    protected = re.sub(r'\b(Dr|Prof|Mr|Mrs|Ms|Jr|Sr|vs|etc|Fig|No)\.', r'\1<DOT>', text)
    protected = re.sub(r'\b(e\.g|i\.e)\.', lambda m: m.group(0).replace('.', '<DOT>'), protected)
    protected = re.sub(r'(\d)\.(\d)', r'\1<DOT>\2', protected)
    parts = re.split(r'(?<=[.!?])\s+|\n+', protected)
    results = []
    for p in parts:
        clean = p.replace('<DOT>', '.').strip()
        if clean:
            results.append(clean)
    return results


def _infer_speaker_role(speaker_name: str, mentor_name: str = '', mentee_name: str = '') -> str:
    s = speaker_name.lower().strip()
    m_name = mentor_name.lower().strip()
    s_name = mentee_name.lower().strip()

    if m_name and (m_name in s or s in m_name):
        return 'MENTOR'
    if s_name and (s_name in s or s in s_name):
        return 'MENTEE'

    mentor_hints = ('dr.', 'dr ', 'prof', 'mentor', 'advisor', 'faculty', 'guide', 'coordinator', 'lead', 'sir', 'ma\'am')
    mentee_hints = ('mentee', 'student', 'dharshini', 'intern', 'scholar', 'candidate')
    if any(h in s for h in mentor_hints):
        return 'MENTOR'
    if any(h in s for h in mentee_hints):
        return 'MENTEE'
    return 'MENTEE'


# ---------------------------------------------------------------------------
# 1. Multi-Speaker Transcript Parser
# ---------------------------------------------------------------------------

def parse_transcript(
    raw_transcript: str,
    mentor_name: str = 'Faculty Mentor',
    mentee_name: str = 'Student Mentee',
) -> list[dict[str, Any]]:
    """
    Parse multi-speaker transcript into structured turns:
      [{"index": 0, "speaker": "Dr. Anitha Raman", "role": "MENTOR", "timestamp": "00:00:15", "text": "..."}]
    Supports:
      - `Speaker Name [00:02:15]: text`
      - `[00:02:15] Speaker Name: text`
      - `Speaker Name (02:15): text`
      - `Mentor: text`
      - Plain unlabelled prose fallback
    """
    if not raw_transcript or not raw_transcript.strip():
        return []

    patterns = [
        # Speaker Name [00:02:15]: text  OR  Speaker Name (00:02:15): text
        re.compile(
            r'^\s*([A-Za-z][A-Za-z0-9\.\'\-\s]{1,42}?)\s*[\[\(](\d{1,2}:\d{2}(?::\d{2})?)[\]\)]\s*:\s*(.+)$'
        ),
        # [00:02:15] Speaker Name: text
        re.compile(
            r'^\s*[\[\(](\d{1,2}:\d{2}(?::\d{2})?)[\]\)]\s*([A-Za-z][A-Za-z0-9\.\'\-\s]{1,42}?)\s*:\s*(.+)$'
        ),
        # Speaker Name: text
        re.compile(
            r'^\s*([A-Za-z][A-Za-z0-9\.\'\-\s]{1,42}?)\s*:\s*(.+)$'
        ),
    ]

    turns: list[dict[str, Any]] = []
    lines = raw_transcript.strip().splitlines()

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        matched = False
        # Pattern 0: Name [ts]: text
        m0 = patterns[0].match(stripped)
        if m0:
            speaker, ts, text = m0.group(1).strip(), m0.group(2).strip(), m0.group(3).strip()
            turns.append({
                'index': len(turns),
                'speaker': speaker,
                'role': _infer_speaker_role(speaker, mentor_name, mentee_name),
                'timestamp': ts,
                'text': text,
            })
            matched = True
        else:
            # Pattern 1: [ts] Name: text
            m1 = patterns[1].match(stripped)
            if m1:
                ts, speaker, text = m1.group(1).strip(), m1.group(2).strip(), m1.group(3).strip()
                turns.append({
                    'index': len(turns),
                    'speaker': speaker,
                    'role': _infer_speaker_role(speaker, mentor_name, mentee_name),
                    'timestamp': ts,
                    'text': text,
                })
                matched = True
            else:
                # Pattern 2: Name: text (guard against false positives like "Note: ..." or URLs)
                m2 = patterns[2].match(stripped)
                if m2 and not stripped.lower().startswith(('http://', 'https://')):
                    candidate_speaker = m2.group(1).strip()
                    if len(candidate_speaker.split()) <= 4:
                        text = m2.group(2).strip()
                        turns.append({
                            'index': len(turns),
                            'speaker': candidate_speaker,
                            'role': _infer_speaker_role(candidate_speaker, mentor_name, mentee_name),
                            'timestamp': '',
                            'text': text,
                        })
                        matched = True

        if not matched:
            if turns:
                turns[-1]['text'] = f"{turns[-1]['text']} {stripped}".strip()
            else:
                turns.append({
                    'index': 0,
                    'speaker': mentee_name or 'Participant',
                    'role': 'MENTEE',
                    'timestamp': '00:00',
                    'text': stripped,
                })

    # If only 1 generic speaker was parsed from unlabelled prose, alternate? No, preserve honesty.
    # Normalize role assignment when 2 distinct speakers exist and neither matched hints
    unique_speakers = list(dict.fromkeys(t['speaker'] for t in turns))
    if len(unique_speakers) == 2:
        roles_found = {t['role'] for t in turns}
        if len(roles_found) == 1:
            # First speaker who asks more questions or initiates is likely MENTOR
            q_counts = {
                sp: sum(t['text'].count('?') for t in turns if t['speaker'] == sp)
                for sp in unique_speakers
            }
            mentor_sp = max(unique_speakers, key=lambda sp: q_counts[sp])
            for t in turns:
                t['role'] = 'MENTOR' if t['speaker'] == mentor_sp else 'MENTEE'

    # Fill synthetic timestamps if completely absent so timeline views look polished
    if turns and all(not t['timestamp'] for t in turns):
        elapsed = 0
        for t in turns:
            mins, secs = divmod(elapsed, 60)
            t['timestamp'] = f"{mins:02d}:{secs:02d}"
            word_est = max(12, len(t['text'].split()))
            elapsed += max(18, int(word_est * 0.65))

    return turns


# ---------------------------------------------------------------------------
# 2. Graph-Based TextRank + TF-IDF Extractive Summarizer (with MMR)
# ---------------------------------------------------------------------------

def _build_tfidf_vectors(tokenized_sentences: list[list[str]]) -> list[dict[str, float]]:
    n_docs = len(tokenized_sentences)
    if n_docs == 0:
        return []

    df: Counter[str] = Counter()
    for tokens in tokenized_sentences:
        for tok in set(tokens):
            df[tok] += 1

    vectors: list[dict[str, float]] = []
    for tokens in tokenized_sentences:
        if not tokens:
            vectors.append({})
            continue
        tf = Counter(tokens)
        total = len(tokens)
        vec = {}
        for tok, count in tf.items():
            idf = math.log((n_docs + 1.0) / (df[tok] + 1.0)) + 1.0
            vec[tok] = (count / total) * idf
        vectors.append(vec)
    return vectors


def _cosine_similarity(v1: dict[str, float], v2: dict[str, float]) -> float:
    if not v1 or not v2:
        return 0.0
    common = set(v1.keys()) & set(v2.keys())
    if not common:
        return 0.0
    dot = sum(v1[k] * v2[k] for k in common)
    norm1 = math.sqrt(sum(val * val for val in v1.values()))
    norm2 = math.sqrt(sum(val * val for val in v2.values()))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


def generate_executive_summary(
    turns: list[dict[str, Any]],
    max_sentences: int = 4,
) -> tuple[str, list[dict[str, Any]]]:
    """
    Run TF-IDF + TextRank graph centrality + Discourse Marker boosts + MMR diversity
    to produce a concise executive summary and return ranked sentences.
    """
    sentence_records: list[dict[str, Any]] = []
    for turn in turns:
        for sent in _split_sentences(turn['text']):
            words = re.findall(r'\w+', sent)
            if len(words) < 5:
                continue
            sentence_records.append({
                'text': sent,
                'speaker': turn['speaker'],
                'role': turn['role'],
                'timestamp': turn['timestamp'],
                'turn_index': turn['index'],
                'word_count': len(words),
                'tokens': _tokenize(sent),
            })

    if not sentence_records:
        fallback = ' '.join(t['text'] for t in turns)[:420].strip()
        return fallback or 'No substantive transcript content available to summarize.', []

    n = len(sentence_records)
    vectors = _build_tfidf_vectors([s['tokens'] for s in sentence_records])

    # Build similarity graph
    sim_matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            sim = _cosine_similarity(vectors[i], vectors[j])
            sim_matrix[i][j] = sim
            sim_matrix[j][i] = sim

    # Iterative TextRank (PageRank over sentence similarity graph)
    damping = 0.85
    scores = [1.0 / n] * n
    for _ in range(25):
        new_scores = [0.0] * n
        for i in range(n):
            incoming = 0.0
            for j in range(n):
                if i == j or sim_matrix[j][i] <= 0.0:
                    continue
                out_sum = sum(sim_matrix[j])
                if out_sum > 0.0:
                    incoming += (sim_matrix[j][i] / out_sum) * scores[j]
            new_scores[i] = (1.0 - damping) / n + damping * incoming
        scores = new_scores

    # Normalize TextRank + combine with TF-IDF information density & discourse boosts
    max_tr = max(scores) if max(scores) > 0 else 1.0
    combined_scores: list[float] = []
    for idx, rec in enumerate(sentence_records):
        norm_tr = scores[idx] / max_tr
        tfidf_weight = sum(vectors[idx].values()) / max(1.0, math.sqrt(len(rec['tokens']) + 1))

        lower = rec['text'].lower()
        discourse_mult = 1.0
        for marker, mult in DISCOURSE_BOOST_MARKERS.items():
            if marker in lower:
                discourse_mult = max(discourse_mult, mult)

        # Mild preference for declarative statements over bare questions in executive summary
        question_penalty = 0.72 if rec['text'].rstrip().endswith('?') else 1.0

        # Mild positional boost for session framing and closing synthesis
        pos_ratio = idx / max(1, n - 1)
        pos_boost = 1.08 if (pos_ratio <= 0.15 or pos_ratio >= 0.82) else 1.0

        # Sweet-spot length bonus (10 to 36 words)
        wc = rec['word_count']
        len_factor = 1.0 if 10 <= wc <= 38 else (0.82 if wc < 10 else 0.90)

        final_score = (0.62 * norm_tr + 0.38 * min(1.5, tfidf_weight)) * discourse_mult * question_penalty * pos_boost * len_factor
        rec['score'] = round(final_score, 4)
        combined_scores.append(final_score)

    # Maximal Marginal Relevance (MMR) selection for crisp non-redundant summary
    target_k = min(max_sentences, max(2, n // 4 + 1), n)
    selected_indices: list[int] = []
    candidate_indices = list(range(n))
    mmr_lambda = 0.72

    while len(selected_indices) < target_k and candidate_indices:
        best_idx = None
        best_mmr = -1e9
        for cid in candidate_indices:
            relevance = combined_scores[cid]
            redundancy = (
                max(sim_matrix[cid][sid] for sid in selected_indices)
                if selected_indices
                else 0.0
            )
            mmr_val = mmr_lambda * relevance - (1.0 - mmr_lambda) * redundancy
            if mmr_val > best_mmr:
                best_mmr = mmr_val
                best_idx = cid
        if best_idx is None:
            break
        selected_indices.append(best_idx)
        candidate_indices.remove(best_idx)

    selected_indices.sort()
    summary_parts = []
    for idx in selected_indices:
        text = sentence_records[idx]['text'].strip()
        if text[-1] not in '.!?':
            text += '.'
        summary_parts.append(text)

    executive_summary = ' '.join(summary_parts)
    ranked = sorted(sentence_records, key=lambda r: r['score'], reverse=True)
    return executive_summary, ranked


# ---------------------------------------------------------------------------
# 3. Topic Clustering & Discussion Insights
# ---------------------------------------------------------------------------

def extract_topics_and_insights(
    turns: list[dict[str, Any]],
    ranked_sentences: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    full_lower = ' '.join(t['text'].lower() for t in turns)

    topic_results: list[dict[str, Any]] = []
    for topic_name, cfg in TOPIC_CLUSTERS.items():
        score = 0.0
        matched_keywords: list[str] = []
        mentions = 0
        for kw, weight in cfg['keywords'].items():
            pattern = r'\b' + re.escape(kw) + r'\b'
            hits = len(re.findall(pattern, full_lower))
            if hits > 0:
                score += hits * weight
                mentions += hits
                matched_keywords.append(kw)
        if score > 0:
            topic_results.append({
                'name': topic_name,
                'color': cfg['color'],
                'raw_score': round(score, 2),
                'mentions': mentions,
                'keywords': matched_keywords[:6],
            })

    topic_results.sort(key=lambda t: t['raw_score'], reverse=True)
    total_score = sum(t['raw_score'] for t in topic_results) or 1.0
    for t in topic_results:
        t['share_pct'] = round((t['raw_score'] / total_score) * 100.0, 1)

    top_topics = topic_results[:5]

    # Build structured Discussion Insights grounded in real top sentences per topic
    insights: list[dict[str, Any]] = []
    used_sentences: set[str] = set()

    for topic in top_topics[:4]:
        topic_kws = set(TOPIC_CLUSTERS[topic['name']]['keywords'].keys())
        best_sent = None
        best_match_score = -1.0

        for rec in ranked_sentences:
            if rec['text'] in used_sentences or rec['text'].rstrip().endswith('?'):
                continue
            low = rec['text'].lower()
            kw_hits = sum(
                TOPIC_CLUSTERS[topic['name']]['keywords'][kw]
                for kw in topic_kws
                if re.search(r'\b' + re.escape(kw) + r'\b', low)
            )
            if kw_hits > 0:
                candidate_score = kw_hits + rec['score'] * 2.0
                if candidate_score > best_match_score:
                    best_match_score = candidate_score
                    best_sent = rec

        if best_sent:
            used_sentences.add(best_sent['text'])
            sent_polarity = _score_sentence_sentiment(best_sent['text'])
            sentiment_tag = (
                'Positive' if sent_polarity >= 62 else
                'Constructive' if sent_polarity >= 46 else
                'Attention Needed'
            )
            kw_display = ', '.join(topic['keywords'][:3])
            insights.append({
                'category': topic['name'],
                'color': topic['color'],
                'title': f"{topic['name']} ({topic['share_pct']}% focus)",
                'detail': best_sent['text'],
                'keywords': topic['keywords'][:4],
                'evidence_speaker': best_sent['speaker'],
                'timestamp': best_sent['timestamp'],
                'sentiment': sentiment_tag,
                'signal_summary': f"Key signals: {kw_display}" if kw_display else 'Core theme detected',
            })

    # If fewer than 3 insights, supplement from highest-ranked unused declarative sentences
    for rec in ranked_sentences:
        if len(insights) >= 4:
            break
        if rec['text'] in used_sentences or rec['text'].rstrip().endswith('?'):
            continue
        used_sentences.add(rec['text'])
        insights.append({
            'category': top_topics[0]['name'] if top_topics else 'Academic Mentoring',
            'color': top_topics[0]['color'] if top_topics else '#14B8A6',
            'title': 'Key Mentoring Observation',
            'detail': rec['text'],
            'keywords': rec['tokens'][:4],
            'evidence_speaker': rec['speaker'],
            'timestamp': rec['timestamp'],
            'sentiment': 'Constructive',
            'signal_summary': 'High centrality insight',
        })

    return top_topics, insights


# ---------------------------------------------------------------------------
# 4. Decision Extractor & Actionable Follow-Up Extractor
# ---------------------------------------------------------------------------

def extract_decisions(turns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    decisions: list[dict[str, Any]] = []
    seen_norms: set[str] = set()

    compiled = [re.compile(p, re.IGNORECASE) for p in DECISION_PATTERNS]
    for turn in turns:
        for sent in _split_sentences(turn['text']):
            if len(sent.split()) < 6 or sent.rstrip().endswith('?'):
                continue
            matches = sum(1 for rx in compiled if rx.search(sent))
            if matches > 0:
                norm = re.sub(r'\W+', '', sent.lower())[:55]
                if norm in seen_norms:
                    continue
                seen_norms.add(norm)
                confidence = min(98, 76 + matches * 11)
                decisions.append({
                    'decision': sent.strip(),
                    'proposed_by': turn['speaker'],
                    'role': turn['role'],
                    'timestamp': turn['timestamp'],
                    'confidence': confidence,
                })
    return decisions[:6]


def _extract_due_label(sentence: str) -> str:
    for pattern in DUE_PATTERNS:
        m = re.search(pattern, sentence, re.IGNORECASE)
        if m:
            raw = m.group(1).strip()
            return raw[0].upper() + raw[1:]
    return 'Next Check-in'


def _infer_priority(sentence: str, due_label: str) -> str:
    low = sentence.lower()
    if any(cue in low for cue in HIGH_PRIORITY_CUES) or any(
        d in due_label.lower() for d in ('tomorrow', 'tonight', 'eod', 'within 1', 'within 2', 'within 3', 'friday')
    ):
        return 'HIGH'
    if any(cue in low for cue in LOW_PRIORITY_CUES):
        return 'LOW'
    return 'MEDIUM'


def _clean_action_description(raw_clause: str) -> str:
    text = raw_clause.strip(' .,;:-')
    # Strip trailing polite suffixes
    text = re.sub(r',?\s*(?:please|thanks|thank you|okay|alright)$', '', text, flags=re.IGNORECASE).strip(' .,;:-')
    if not text:
        return ''
    text = text[0].upper() + text[1:]
    if text[-1] not in '.!':
        text += '.'
    return text


def extract_action_items(
    turns: list[dict[str, Any]],
    mentor_name: str = 'Faculty Mentor',
    mentee_name: str = 'Student Mentee',
) -> list[dict[str, Any]]:
    """Extract structured actionable follow-ups with owner, role, priority & due date."""
    items: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    compiled_patterns = [re.compile(p, re.IGNORECASE) for p in ACTION_COMMITMENT_PATTERNS]

    for turn in turns:
        speaker = turn['speaker']
        role = turn['role']
        other_name = mentee_name if role == 'MENTOR' else mentor_name
        other_role = 'MENTEE' if role == 'MENTOR' else 'MENTOR'

        for sent in _split_sentences(turn['text']):
            if len(sent.split()) < 5:
                continue

            lower = sent.lower()
            matched_clause = None
            pattern_idx = -1

            for idx, rx in enumerate(compiled_patterns):
                m = rx.search(sent)
                if m:
                    matched_clause = m.group(1) if m.lastindex else sent
                    pattern_idx = idx
                    break

            if not matched_clause:
                # Also catch strong imperative sentences from mentors ("Complete...", "Submit...", "Refactor...")
                first_word = re.findall(r'[a-zA-Z]+', lower)
                if first_word and first_word[0] in ACTION_STRONG_VERBS and role == 'MENTOR':
                    matched_clause = sent
                    pattern_idx = 1
                else:
                    continue

            # Ensure matched clause actually contains a meaningful action verb
            clause_words = set(re.findall(r'[a-zA-Z]+', matched_clause.lower()))
            if not (clause_words & ACTION_STRONG_VERBS):
                # Allow if explicitly labelled action item / follow-up
                if pattern_idx not in (2, 3):
                    continue

            desc = _clean_action_description(matched_clause)
            if len(desc.split()) < 4:
                continue

            # Deduplicate near-identical follow-ups
            key = ' '.join(_tokenize(desc)[:6])
            if not key or key in seen_keys:
                continue
            seen_keys.add(key)

            # Determine assignee & role intelligently
            if pattern_idx == 0:
                # "I will / I'll / I need to ..." -> speaker themselves
                assignee_name = speaker
                assignee_role = role
            elif pattern_idx == 1:
                # "You should / Please / Could you / Imperative" -> directed to the other participant
                assignee_name = other_name or mentee_name
                assignee_role = other_role
            elif pattern_idx in (2, 3):
                # Explicit "Action item: ..." -> infer from mention of mentor/mentee name
                if mentor_name and mentor_name.split()[0].lower() in lower:
                    assignee_name, assignee_role = mentor_name, 'MENTOR'
                else:
                    assignee_name, assignee_role = mentee_name or speaker, 'MENTEE'
            else:
                # "We need to / We should" -> default to mentee unless mentor-specific verb
                if any(v in lower for v in ('endorse', 'nominate', 'email the hod', 'review your draft', 'send you the rubric')):
                    assignee_name, assignee_role = mentor_name, 'MENTOR'
                else:
                    assignee_name, assignee_role = mentee_name, 'MENTEE'

            due_label = _extract_due_label(sent)
            priority = _infer_priority(sent, due_label)

            items.append({
                'description': desc,
                'assignee_name': assignee_name,
                'assignee_role': assignee_role,
                'priority': priority,
                'due_label': due_label,
                'status': 'PENDING',
                'source_timestamp': turn['timestamp'],
            })

    # Prioritize HIGH first, cap to 8 crisp items
    prio_rank = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    items.sort(key=lambda x: prio_rank.get(x['priority'], 1))
    return items[:8]


# ---------------------------------------------------------------------------
# 5. Speaker Analytics, Sentiment & Engagement Scoring
# ---------------------------------------------------------------------------

def _score_sentence_sentiment(text: str) -> float:
    """Return 0-100 positivity/constructiveness score with negation handling."""
    tokens = re.findall(r"[a-zA-Z']+", text.lower())
    pos = 0.0
    neg = 0.0
    for i, tok in enumerate(tokens):
        negated = any(tokens[j] in NEGATORS for j in range(max(0, i - 2), i))
        if tok in POSITIVE_LEXICON:
            w = POSITIVE_LEXICON[tok]
            if negated:
                neg += w * 0.85
            else:
                pos += w
        elif tok in CONCERN_LEXICON:
            w = CONCERN_LEXICON[tok]
            if negated:
                pos += w * 0.65
            else:
                neg += w
    if pos == 0.0 and neg == 0.0:
        return 62.0  # neutral-constructive academic baseline
    raw = (pos - neg) / (pos + neg + 1.5)  # range roughly -1..+1
    return round(max(15.0, min(98.0, 62.0 + raw * 38.0)), 1)


def compute_speaker_and_engagement_metrics(
    turns: list[dict[str, Any]],
    action_count: int,
    decision_count: int,
) -> tuple[dict[str, Any], float, float]:
    if not turns:
        return (
            {
                'speakers': [],
                'total_words': 0,
                'total_turns': 0,
                'question_count': 0,
                'balance_score': 0.0,
                'sentiment_label': 'Neutral',
                'sentiment_breakdown': {'positive': 0, 'constructive': 0, 'concern': 0},
            },
            60.0,
            50.0,
        )

    speaker_stats: dict[str, dict[str, Any]] = {}
    total_words = 0
    total_questions = 0
    sentiment_buckets = {'positive': 0, 'constructive': 0, 'concern': 0}
    turn_sentiments: list[float] = []

    for turn in turns:
        sp = turn['speaker']
        words = re.findall(r'\w+', turn['text'])
        wc = len(words)
        q_cnt = turn['text'].count('?')
        sent_score = _score_sentence_sentiment(turn['text'])
        turn_sentiments.append(sent_score)

        if sent_score >= 68:
            sentiment_buckets['positive'] += 1
        elif sent_score >= 52:
            sentiment_buckets['constructive'] += 1
        else:
            sentiment_buckets['concern'] += 1

        total_words += wc
        total_questions += q_cnt

        if sp not in speaker_stats:
            speaker_stats[sp] = {
                'name': sp,
                'role': turn['role'],
                'turns': 0,
                'word_count': 0,
                'questions_asked': 0,
                'sentiment_sum': 0.0,
            }
        speaker_stats[sp]['turns'] += 1
        speaker_stats[sp]['word_count'] += wc
        speaker_stats[sp]['questions_asked'] += q_cnt
        speaker_stats[sp]['sentiment_sum'] += sent_score

    speakers_list = []
    ratios = []
    for sp_data in speaker_stats.values():
        ratio = (sp_data['word_count'] / max(1, total_words)) * 100.0
        ratios.append(ratio / 100.0)
        avg_sent = sp_data['sentiment_sum'] / max(1, sp_data['turns'])
        speakers_list.append({
            'name': sp_data['name'],
            'role': sp_data['role'],
            'turns': sp_data['turns'],
            'word_count': sp_data['word_count'],
            'talk_ratio_pct': round(ratio, 1),
            'avg_words_per_turn': round(sp_data['word_count'] / max(1, sp_data['turns']), 1),
            'questions_asked': sp_data['questions_asked'],
            'sentiment_score': round(avg_sent, 1),
        })

    speakers_list.sort(key=lambda s: s['word_count'], reverse=True)

    # Dialogue balance via normalized Shannon entropy (100 = perfectly balanced dialogue)
    if len(ratios) > 1:
        entropy = -sum(p * math.log2(p) for p in ratios if p > 0)
        max_entropy = math.log2(len(ratios))
        balance_score = round((entropy / max_entropy) * 100.0, 1)
    else:
        balance_score = 45.0

    overall_sentiment = round(sum(turn_sentiments) / max(1, len(turn_sentiments)), 1)
    if overall_sentiment >= 74:
        sentiment_label = 'Highly Positive'
    elif overall_sentiment >= 61:
        sentiment_label = 'Constructive & Collaborative'
    elif overall_sentiment >= 50:
        sentiment_label = 'Focused / Analytical'
    else:
        sentiment_label = 'Needs Academic Support'

    # Engagement Index (0-100): Dialogue balance + Question density + Depth + Actionability
    turn_depth_score = min(100.0, (len(turns) / 10.0) * 65.0 + min(35.0, (total_words / 320.0) * 35.0))
    question_density_score = min(100.0, (total_questions / max(1.0, len(turns) * 0.35)) * 85.0)
    outcome_density_score = min(100.0, action_count * 14.0 + decision_count * 12.0)

    engagement_score = round(
        min(
            99.0,
            max(
                35.0,
                0.32 * balance_score
                + 0.28 * turn_depth_score
                + 0.20 * question_density_score
                + 0.20 * outcome_density_score,
            ),
        ),
        1,
    )

    metrics = {
        'speakers': speakers_list,
        'total_words': total_words,
        'total_turns': len(turns),
        'question_count': total_questions,
        'balance_score': balance_score,
        'sentiment_label': sentiment_label,
        'sentiment_breakdown': sentiment_buckets,
        'parsed_turns': turns,
    }
    return metrics, overall_sentiment, engagement_score


# ---------------------------------------------------------------------------
# 6. Automated Academic Meeting Minutes Generator (Markdown)
# ---------------------------------------------------------------------------

def generate_markdown_minutes(
    *,
    session_code: str,
    title: str,
    mentor_name: str,
    mentee_name: str,
    course_or_track: str,
    scheduled_at: datetime | str,
    duration_minutes: int,
    executive_summary: str,
    topics: list[dict[str, Any]],
    insights: list[dict[str, Any]],
    decisions: list[dict[str, Any]],
    action_items: list[dict[str, Any]],
    speaker_metrics: dict[str, Any],
    sentiment_score: float,
    engagement_score: float,
    is_confidential: bool = False,
) -> str:
    date_str = (
        scheduled_at.strftime('%B %d, %Y · %I:%M %p')
        if isinstance(scheduled_at, datetime)
        else str(scheduled_at)
    )
    conf_badge = 'CONFIDENTIAL — ACADEMIC ADVISORY RECORD' if is_confidential else 'STANDARD ACADEMIC MENTORING RECORD'
    sentiment_label = speaker_metrics.get('sentiment_label', 'Constructive')

    lines = [
        f"# Academic Mentoring Minutes — {title}",
        f"> **{conf_badge}** | Session Code: `{session_code}`",
        "",
        "## 1. Session Metadata",
        "| Attribute | Details |",
        "| :--- | :--- |",
        f"| **Session Code** | `{session_code}` |",
        f"| **Faculty Mentor** | {mentor_name} |",
        f"| **Student Mentee** | {mentee_name} |",
        f"| **Academic Track / Course** | {course_or_track} |",
        f"| **Date & Time** | {date_str} |",
        f"| **Duration** | {duration_minutes} minutes |",
        f"| **Engagement Index** | **{engagement_score} / 100** |",
        f"| **Sentiment Climate** | **{sentiment_score} / 100** ({sentiment_label}) |",
        "",
        "## 2. Executive Summary",
        executive_summary or "_No executive summary generated._",
        "",
    ]

    if topics:
        lines.append("## 3. Academic Discussion Themes")
        for t in topics:
            kws = ', '.join(t.get('keywords', []))
            lines.append(f"- **{t['name']}** — `{t.get('share_pct', 0)}%` share *(Keywords: {kws})*")
        lines.append("")

    if insights:
        lines.append("## 4. Key Discussion Insights")
        for idx, ins in enumerate(insights, 1):
            sp = ins.get('evidence_speaker', 'Participant')
            ts = ins.get('timestamp', '')
            ts_part = f" `[{ts}]`" if ts else ''
            lines.append(f"{idx}. **{ins.get('title', ins.get('category', 'Insight'))}** — {ins.get('detail', '')} *(Source: {sp}{ts_part})*")
        lines.append("")

    lines.append("## 5. Recorded Decisions & Agreements")
    if decisions:
        for idx, d in enumerate(decisions, 1):
            lines.append(
                f"{idx}. {d['decision']} *(Proposed by {d.get('proposed_by', 'Mentor')} · Confidence: {d.get('confidence', 85)}%)*"
            )
    else:
        lines.append("- _No formal policy/architecture decisions logged; focus was exploratory mentoring._")
    lines.append("")

    lines.append("## 6. Actionable Follow-Up Items")
    if action_items:
        lines.append("| # | Action Item | Assignee | Role | Priority | Target Due | Status |")
        lines.append("| :---: | :--- | :--- | :---: | :---: | :--- | :---: |")
        for idx, item in enumerate(action_items, 1):
            desc = str(item.get('description', '')).replace('|', '/')
            lines.append(
                f"| {idx} | {desc} | {item.get('assignee_name', 'Mentee')} | "
                f"{item.get('assignee_role', 'MENTEE')} | **{item.get('priority', 'MEDIUM')}** | "
                f"{item.get('due_label', 'Next Check-in')} | `{item.get('status', 'PENDING')}` |"
            )
    else:
        lines.append("_No explicit follow-up actions extracted._")
    lines.append("")

    speakers = speaker_metrics.get('speakers', [])
    if speakers:
        lines.append("## 7. Participation & Conversation Analytics")
        lines.append("| Speaker | Role | Turns | Words | Talk Share | Questions | Sentiment |")
        lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |")
        for sp in speakers:
            lines.append(
                f"| {sp['name']} | {sp['role']} | {sp['turns']} | {sp['word_count']} | "
                f"{sp['talk_ratio_pct']}% | {sp['questions_asked']} | {sp['sentiment_score']}/100 |"
            )
        lines.append("")

    lines.extend([
        "---",
        "*Generated automatically by **MentorSync AI** — Smart Meeting Intelligence System (TextRank + TF-IDF NLP Pipeline).*",
    ])
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Master Pipeline Orchestrator
# ---------------------------------------------------------------------------

def analyze_transcript(
    raw_transcript: str,
    *,
    session_code: str = 'MS-2026-NEW',
    title: str = 'Academic Mentoring Session',
    mentor_name: str = 'Faculty Mentor',
    mentee_name: str = 'Student Mentee',
    course_or_track: str = 'Academic Mentoring',
    scheduled_at: datetime | str = '',
    duration_minutes: int = 45,
    is_confidential: bool = False,
) -> dict[str, Any]:
    """Execute the complete pure-Python NLP summarization & intelligence workflow."""
    turns = parse_transcript(raw_transcript, mentor_name=mentor_name, mentee_name=mentee_name)
    executive_summary, ranked_sentences = generate_executive_summary(turns, max_sentences=4)
    topics, key_insights = extract_topics_and_insights(turns, ranked_sentences)
    decisions = extract_decisions(turns)
    action_items = extract_action_items(turns, mentor_name=mentor_name, mentee_name=mentee_name)
    speaker_metrics, sentiment_score, engagement_score = compute_speaker_and_engagement_metrics(
        turns,
        action_count=len(action_items),
        decision_count=len(decisions),
    )

    markdown_doc = generate_markdown_minutes(
        session_code=session_code,
        title=title,
        mentor_name=mentor_name,
        mentee_name=mentee_name,
        course_or_track=course_or_track,
        scheduled_at=scheduled_at or datetime.now(),
        duration_minutes=duration_minutes,
        executive_summary=executive_summary,
        topics=topics,
        insights=key_insights,
        decisions=decisions,
        action_items=action_items,
        speaker_metrics=speaker_metrics,
        sentiment_score=sentiment_score,
        engagement_score=engagement_score,
        is_confidential=is_confidential,
    )

    return {
        'executive_summary': executive_summary,
        'key_insights': key_insights,
        'decisions': decisions,
        'topics': topics,
        'action_items': action_items,
        'speaker_metrics': speaker_metrics,
        'sentiment_score': sentiment_score,
        'engagement_score': engagement_score,
        'generated_markdown_doc': markdown_doc,
    }
