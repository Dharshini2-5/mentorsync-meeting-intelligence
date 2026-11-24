import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  Lock,
  Mic,
  MicOff,
  Sparkles,
  Square,
  Users,
  Wand2,
} from 'lucide-react';
import { api } from '../api/client';
import { SAMPLE_TRANSCRIPTS } from '../data/sampleTranscripts';
import { BorderBeam, CountUp, GradientText, SpotlightCard, StarBorder } from './reactbits';

const PRIORITY_STYLES = {
  HIGH: 'border-rose-400/40 bg-rose-500/15 text-rose-300',
  MEDIUM: 'border-orange-400/40 bg-orange-500/15 text-orange-300',
  LOW: 'border-slate-600 bg-slate-800 text-slate-300',
};

export default function CaptureStudio({
  user,
  directory,
  defaultConfidential = false,
  onSessionCreated,
  onInspectSession,
}) {
  const [title, setTitle] = useState('');
  const [courseOrTrack, setCourseOrTrack] = useState('Academic Mentoring — Capstone & Career');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [mentorId, setMentorId] = useState('');
  const [menteeId, setMenteeId] = useState('');
  const [isConfidential, setIsConfidential] = useState(Boolean(defaultConfidential));
  const [transcript, setTranscript] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Live Browser Speech-to-Text Capture
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('MENTOR');
  const [interimText, setInterimText] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');
  const recognitionRef = useRef(null);
  const recordStartRef = useRef(0);
  const activeSpeakerRef = useRef(activeSpeaker);

  // Pipeline Execution State
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRec));
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    if (directory?.mentors?.length && !mentorId) {
      const defMentor =
        user?.role === 'MENTOR'
          ? directory.mentors.find((m) => m.id === user.id) || directory.mentors[0]
          : directory.mentors[0];
      if (defMentor) setMentorId(String(defMentor.id));
    }
    if (directory?.mentees?.length && !menteeId) {
      const defMentee =
        user?.role === 'MENTEE'
          ? directory.mentees.find((m) => m.id === user.id) || directory.mentees[0]
          : directory.mentees[0];
      if (defMentee) setMenteeId(String(defMentee.id));
    }
  }, [directory, user, mentorId, menteeId]);

  const getSpeakerLabel = (roleKey) => {
    if (roleKey === 'MENTOR') {
      const found = directory?.mentors?.find((m) => String(m.id) === String(mentorId));
      return found?.full_name || 'Dr. Anitha Raman';
    }
    const found = directory?.mentees?.find((m) => String(m.id) === String(menteeId));
    return found?.full_name || user?.full_name || 'Dharshini A';
  };

  const toggleRecording = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechNotice(
        'Live Web Speech API is not enabled in this browser. Paste a transcript, upload a .txt file, or click a 1-click sample below!'
      );
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
      setInterimText('');
      return;
    }

    setSpeechNotice('');
    recordStartRef.current = Date.now();
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal && piece) {
          const elapsedSec = Math.floor((Date.now() - recordStartRef.current) / 1000);
          const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const secs = String(elapsedSec % 60).padStart(2, '0');
          const spName = getSpeakerLabel(activeSpeakerRef.current);
          const formatted = `${spName} [00:${mins}:${secs}]: ${piece}`;
          setTranscript((prev) => (prev.trim() ? `${prev.trim()}\n${formatted}` : formatted));
        } else {
          interim += `${piece} `;
        }
      }
      setInterimText(interim.trim());
    };

    rec.onerror = (ev) => {
      setSpeechNotice(`Microphone capture paused (${ev.error}). You can continue typing or use a sample transcript.`);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsRecording(true);
    } catch {
      setSpeechNotice('Could not access microphone. Please grant browser audio permission or paste transcript text.');
    }
  };

  const handleLoadSample = (sample) => {
    setTitle(sample.title);
    setCourseOrTrack(sample.track);
    setDurationMinutes(sample.duration);
    setTranscript(sample.transcript);
    setUploadedFile(null);
    setError('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    try {
      const content = await file.text();
      setTranscript(content);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
      }
    } catch {
      setError('Could not read the selected .txt transcript file.');
    }
  };

  const handleRunPipeline = async (e) => {
    e.preventDefault();
    setError('');
    if (!transcript.trim() && !uploadedFile) {
      setError('Please paste a mentoring transcript, upload a .txt file, or load a sample conversation.');
      return;
    }

    setAnalyzing(true);
    try {
      let payload;
      if (uploadedFile) {
        const fd = new FormData();
        fd.append('transcript_file', uploadedFile);
        fd.append('title', title || 'Uploaded Mentoring Session');
        fd.append('course_or_track', courseOrTrack);
        fd.append('duration_minutes', String(durationMinutes));
        if (mentorId) fd.append('mentor_id', mentorId);
        if (menteeId) fd.append('mentee_id', menteeId);
        fd.append('is_confidential', String(isConfidential));
        payload = fd;
      } else {
        payload = {
          title: title || 'Mentoring Session Intelligence Brief',
          course_or_track: courseOrTrack,
          duration_minutes: Number(durationMinutes) || 40,
          mentor_id: mentorId || undefined,
          mentee_id: menteeId || undefined,
          is_confidential: isConfidential,
          raw_transcript: transcript,
        };
      }

      const created = await api.quickAnalyze(payload);
      setResult(created);
      onSessionCreated(created);
    } catch (err) {
      setError(err.message || 'NLP pipeline execution failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-teal-300">
            <BrainCircuit className="h-3.5 w-3.5" />
            Live Capture & NLP Summarization Studio
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            Process <GradientText>Mentor–Mentee Transcripts</GradientText>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Paste recorded conversation text, upload a `.txt` transcript, dictate live via microphone,
            or try a curated academic mentoring sample.
          </p>
        </div>
      </div>

      {/* 1-Click Sample Transcript Bar */}
      <SpotlightCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-orange-300">
            <Wand2 className="h-4 w-4" />
            1-Click Sample Mentoring Transcripts:
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TRANSCRIPTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleLoadSample(s)}
                className="cursor-pointer rounded-lg border border-slate-700/80 bg-[#081322] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-teal-400/50 hover:bg-teal-500/10 hover:text-teal-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </SpotlightCard>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Input Form Column */}
        <SpotlightCard className="p-6 lg:col-span-6">
          <form onSubmit={handleRunPipeline} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Session Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Final Year Capstone NLP Architecture Review"
                className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Course / Academic Track
                </label>
                <input
                  type="text"
                  value={courseOrTrack}
                  onChange={(e) => setCourseOrTrack(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Faculty Mentor
                </label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
                >
                  {(directory?.mentors || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Student Mentee
                </label>
                <select
                  value={menteeId}
                  onChange={(e) => setMenteeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
                >
                  {(directory?.mentees || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capture Controls: Upload .txt + Web Speech Live Capture */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#07111F]/90 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-teal-200">
                  <FileUp className="h-3.5 w-3.5 text-teal-400" />
                  {uploadedFile ? uploadedFile.name : 'Upload .txt'}
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    isRecording
                      ? 'border-rose-400/60 bg-rose-500/20 text-rose-200'
                      : 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-3 w-3 fill-current" />
                      Stop Dictation
                    </>
                  ) : speechSupported ? (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      Live Speech-to-Text
                    </>
                  ) : (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      Speech-to-Text (Check Support)
                    </>
                  )}
                </button>
              </div>

              {isRecording && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 animate-ping rounded-full bg-rose-400" />
                  <span className="text-slate-400">Speaking as:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSpeaker((s) => (s === 'MENTOR' ? 'MENTEE' : 'MENTOR'))
                    }
                    className="cursor-pointer rounded-md border border-teal-400/40 bg-teal-500/15 px-2 py-0.5 font-mono text-teal-200"
                  >
                    {activeSpeaker} ⇄
                  </button>
                </div>
              )}
            </div>

            {speechNotice && (
              <div className="rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
                {speechNotice}
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <label className="font-medium text-slate-300">
                  Recorded Conversation Transcript
                </label>
                <span className="font-mono text-slate-500">
                  {transcript.trim() ? `${transcript.trim().split(/\s+/).length} words` : 'Format: Speaker [00:01:20]: text'}
                </span>
              </div>
              <textarea
                rows={11}
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setUploadedFile(null);
                }}
                placeholder={`Dr. Anitha Raman [00:00:15]: Welcome! Let's review your project progress...\nDharshini A [00:01:10]: I finished the Django REST API and will complete the benchmarks by Friday...`}
                className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] p-3.5 font-mono text-xs leading-relaxed text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
              />
              {interimText && (
                <div className="mt-1.5 text-xs italic text-teal-300">
                  Listening: “{interimText}”
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-teal-500"
                />
                <Lock className="h-3.5 w-3.5 text-orange-400" />
                Mark as Confidential Academic Counseling Record
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <StarBorder
              type="submit"
              disabled={analyzing}
              className="w-full"
              color="#14B8A6"
              secondaryColor="#6366F1"
            >
              <Sparkles className={`h-4 w-4 text-teal-400 ${analyzing ? 'animate-spin' : ''}`} />
              <span>
                {analyzing
                  ? 'Executing TextRank + TF-IDF NLP Pipeline...'
                  : 'Run NLP Summarization Pipeline'}
              </span>
            </StarBorder>
          </form>
        </SpotlightCard>

        {/* Live NLP Output Column */}
        <div className="lg:col-span-6">
          {result ? (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel relative overflow-hidden rounded-2xl p-6"
            >
              <BorderBeam colorFrom="#14B8A6" colorTo="#FB923C" />

              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="rounded-md bg-teal-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-300">
                    {result.session_code} · NLP PROCESSED
                  </span>
                  <h2 className="mt-1.5 font-display text-xl font-bold text-white">
                    {result.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectSession(result.id)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-teal-400/40 bg-teal-500/15 px-3.5 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Open Full Minutes
                </button>
              </div>

              {/* Engagement & Sentiment Gauges */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-center">
                  <div className="text-[11px] text-slate-400">Engagement</div>
                  <div className="mt-1 font-display text-2xl font-bold text-teal-300">
                    <CountUp to={result.engagement_score} decimals={1} suffix="%" />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-center">
                  <div className="text-[11px] text-slate-400">Sentiment</div>
                  <div className="mt-1 font-display text-2xl font-bold text-indigo-300">
                    <CountUp to={result.sentiment_score} decimals={1} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-center">
                  <div className="text-[11px] text-slate-400">Follow-Ups</div>
                  <div className="mt-1 font-display text-2xl font-bold text-orange-300">
                    <CountUp to={(result.action_items || []).length} />
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mt-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-teal-300">
                  Executive Summary (TextRank + MMR)
                </h3>
                <p className="mt-2 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5 text-sm leading-relaxed text-slate-200">
                  {result.executive_summary}
                </p>
              </div>

              {/* Speaker Talk-Time Distribution */}
              {(result.speaker_metrics?.speakers || []).length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-slate-400">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      Speaker Talk-Time Share
                    </span>
                    <span className="font-mono text-slate-500">
                      Balance: {result.speaker_metrics.balance_score}%
                    </span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    {result.speaker_metrics.speakers.map((sp, i) => (
                      <div
                        key={sp.name}
                        style={{
                          width: `${sp.talk_ratio_pct}%`,
                          backgroundColor: i === 0 ? '#14B8A6' : i === 1 ? '#6366F1' : '#FB923C',
                        }}
                        title={`${sp.name}: ${sp.talk_ratio_pct}%`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-300">
                    {result.speaker_metrics.speakers.map((sp, i) => (
                      <span key={sp.name} className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: i === 0 ? '#14B8A6' : i === 1 ? '#6366F1' : '#FB923C',
                          }}
                        />
                        {sp.name} <strong className="font-mono">{sp.talk_ratio_pct}%</strong> ({sp.questions_asked} Qs)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Decisions */}
              {(result.decisions || []).length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-300">
                    Recorded Decisions ({result.decisions.length})
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {result.decisions.slice(0, 3).map((d, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-[#07111F]/90 px-3 py-2 text-xs leading-relaxed text-slate-200"
                      >
                        {d.decision}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Action Items */}
              <div className="mt-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-300">
                  Extracted Actionable Follow-Ups ({(result.action_items || []).length})
                </h3>
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {(result.action_items || []).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-xs"
                    >
                      <div className="flex items-start gap-2 text-slate-100">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                        <span>{item.description}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 pl-5 text-[10px]">
                        <span
                          className={`rounded border px-1.5 py-0.5 font-mono font-semibold ${
                            PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          {item.assignee_name} ({item.assignee_role})
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-teal-300">
                          <Clock className="h-3 w-3" />
                          {item.due_label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <SpotlightCard className="flex h-full min-h-[540px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-300">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">
                NLP Intelligence Preview Ready
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                Select one of the sample transcripts above, paste your mentor–mentee notes, or dictate
                live — then run the pipeline to inspect summaries, insights, decisions, speaker
                ratios, and auto-extracted follow-ups.
              </p>
              <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-2.5 text-left text-xs text-slate-400">
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/80 p-3">
                  <div className="font-semibold text-teal-300">1. Graph TextRank</div>
                  <div className="mt-0.5 text-[11px]">TF-IDF centrality + MMR summary</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/80 p-3">
                  <div className="font-semibold text-indigo-300">2. Topic Clustering</div>
                  <div className="mt-0.5 text-[11px]">6 academic theme taxonomy</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/80 p-3">
                  <div className="font-semibold text-orange-300">3. Action Attribution</div>
                  <div className="mt-0.5 text-[11px]">Owner, role, priority & due date</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/80 p-3">
                  <div className="font-semibold text-sky-300">4. Auto Minutes</div>
                  <div className="mt-0.5 text-[11px]">Structured Markdown & PDF print</div>
                </div>
              </div>
            </SpotlightCard>
          )}
        </div>
      </div>
    </div>
  );
}
