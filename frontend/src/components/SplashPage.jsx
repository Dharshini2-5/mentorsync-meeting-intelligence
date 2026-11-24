import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  AudioWaveform,
  BrainCircuit,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  GraduationCap,
  Lock,
  Mic,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
  BlurText,
  BorderBeam,
  CountUp,
  DecryptedText,
  DotGrid,
  GlareHover,
  GradientText,
  Magnet,
  RotatingText,
  ShinyText,
  SplitText,
  SpotlightCard,
  StarBorder,
  TiltedCard,
  TrueFocus,
  Waves,
} from './reactbits';

const TRUSTED_ACADEMIC_ORGS = [
  'Anna Univ · Dept. of ECE',
  'Capstone AI Research Lab',
  'IEEE Student Mentoring Chapter',
  'Academic Quality & NAAC Cell',
  'Graduate Placement Council',
  'Embedded Systems Studio',
  'Signal Processing Faculty Group',
  'Honors Advising Commons',
];

const PRICING_TIERS = [
  {
    id: 'starter',
    name: 'Faculty Starter',
    tagline: 'For individual faculty advisors & project mentors',
    monthly: 0,
    annual: 0,
    cta: 'Start Free Workspace',
    popular: false,
    features: [
      'Up to 15 mentoring sessions / month',
      'Pure-Python TextRank + TF-IDF summaries',
      'Speaker talk-ratio & sentiment scoring',
      '1-click Markdown & Print-PDF minutes',
      'HS256 JWT role-based session access',
    ],
  },
  {
    id: 'pro',
    name: 'Department Pro',
    tagline: 'For academic departments & capstone mentoring cohorts',
    monthly: 39,
    annual: 31,
    cta: 'Launch Department Pro',
    popular: true,
    features: [
      'Unlimited NLP summaries & automated minutes',
      'Multi-workspace switcher (ECE, Capstone, Placement)',
      'Cross-session follow-up ledger & milestone sliders',
      'Live Browser Speech-to-Text + .txt batch ingestion',
      'Developer API keys (`ms_live_*`) & LMS webhooks',
      '1-click Compliance CSV & Intelligence JSON exports',
    ],
  },
  {
    id: 'enterprise',
    name: 'University Enterprise',
    tagline: 'Campus-wide deployment with custom compliance & SSO',
    monthly: null,
    annual: null,
    cta: 'Contact Academic Sales',
    popular: false,
    features: [
      'FERPA / NAAC / NBA accreditation audit vaults',
      'Campus SAML 2.0 / OIDC SSO & multi-dept RBAC',
      'Dedicated Python NLP compute nodes',
      'Canvas, Moodle & Blackboard native bi-directional sync',
      '99.9% Uptime SLA & custom retention policies',
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: 'How does MentorSync AI summarize mentoring sessions without external paid LLM APIs?',
    a: 'MentorSync AI ships a deterministic, zero-dependency Pure-Python NLP engine inside Django (`nlp_summarizer.py`). It combines TF-IDF cosine similarity graphs, iterative TextRank centrality, academic discourse-marker boosts, and Maximal Marginal Relevance (MMR) diversity — executing in under 50ms with full data sovereignty.',
  },
  {
    q: 'How are confidential student counseling sessions protected?',
    a: 'Every API call is secured with HS256 JWT tokens and role-scoped Django querysets (`MENTOR`, `MENTEE`, `COORDINATOR`). Sessions flagged as Confidential are strictly isolated to authorized participants and coordinators, never leaking into unauthorized views.',
  },
  {
    q: 'Do automated academic minutes stay synchronized when follow-up tasks are completed?',
    a: 'Yes! Whenever a mentor or mentee transitions an action item status (Pending → In Progress → Completed) on the dashboard, follow-up board, or session inspector, Django automatically regenerates the structured Markdown academic minutes ready for copy, `.md` download, or Print-to-PDF.',
  },
  {
    q: 'Can we capture live mentoring conversations without typing transcripts manually?',
    a: 'Absolutely. Capture & NLP Studio supports live Browser Web Speech-to-Text dictation with instant Mentor/Mentee speaker toggling, `.txt` transcript file uploads, paste-and-analyze workflows, and curated 1-click academic demo transcripts.',
  },
  {
    q: 'Does MentorSync AI support accreditation & LMS exports?',
    a: 'Department Pro and University Enterprise workspaces include 1-click RFC-4180 CSV exports for sessions and action items, complete JSON academic intelligence bundles, `ms_live_` API keys, and configurable LMS/Slack webhooks.',
  },
];

const COMPLIANCE_BADGES = [
  { icon: Lock, label: 'HS256 JWT Secured', sub: 'Zero-trust bearer auth' },
  { icon: ShieldCheck, label: 'Confidential Flagging', sub: 'Role-scoped counseling' },
  { icon: FileCheck2, label: 'Automated Audit Docs', sub: 'NAAC / FERPA ready' },
  { icon: Server, label: '99.9% Uptime SLA', sub: 'Sub-50ms Python NLP' },
];

export default function SplashPage({
  stats,
  user,
  onOpenDashboard,
  onOpenCapture,
  onOpenAuth,
}) {
  const { isLight } = useTheme();
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  const features = [
    {
      icon: BrainCircuit,
      accent: 'text-teal-300',
      badge: 'TextRank + TF-IDF',
      title: 'Extractive NLP Summarization',
      description:
        'Graph-based TextRank centrality combined with discourse-marker boosts and MMR diversity distills long mentoring dialogues into crisp executive briefs.',
    },
    {
      icon: CheckCircle2,
      accent: 'text-indigo-300',
      badge: 'Smart Attribution',
      title: 'Decisions & Actionable Follow-Ups',
      description:
        'Automatically extracts commitments, mentor vs. mentee assignees, urgency priorities, and explicit or relative deadlines like "by Friday" or "within 3 days".',
    },
    {
      icon: FileText,
      accent: 'text-orange-300',
      badge: '1-Click Minutes',
      title: 'Automated Academic Documentation',
      description:
        'Generates publication-ready Markdown academic minutes synced live with follow-up completion states — ready to preview, copy, download, or print as PDF.',
    },
    {
      icon: ShieldCheck,
      accent: 'text-sky-300',
      badge: 'HS256 JWT Vault',
      title: 'Secure Role-Based Dashboards',
      description:
        'Protected Django REST Framework endpoints with role-scoped visibility for Faculty Mentors, Student Mentees, and Academic Coordinators.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Capture Interaction',
      desc: 'Paste transcripts, upload .txt recordings, or dictate live using Browser Speech-to-Text.',
      icon: Mic,
      color: 'from-teal-500/20 to-teal-500/5 border-teal-400/30 text-teal-300',
    },
    {
      step: '02',
      title: 'NLP Graph Intelligence',
      desc: 'Multi-speaker parser, TextRank summarizer, 6-theme academic clustering & sentiment scoring.',
      icon: AudioWaveform,
      color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-400/30 text-indigo-300',
    },
    {
      step: '03',
      title: 'Track & Document',
      desc: 'Monitor longitudinal engagement, resolve follow-ups, and export structured academic minutes.',
      icon: TrendingUp,
      color: 'from-orange-500/20 to-orange-500/5 border-orange-400/30 text-orange-300',
    },
  ];

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pipeline', label: 'NLP Pipeline' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060D16] text-slate-100">
      {/* Interactive Acoustic Waves + Reactive DotGrid Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <DotGrid gap={32} proximity={145} />
        <Waves
          lineColor="rgba(20, 184, 166, 0.22)"
          secondaryColor="rgba(99, 102, 241, 0.17)"
          yGap={40}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(13,148,136,0.10), transparent 65%), radial-gradient(ellipse 55% 45% at 85% 35%, rgba(79,70,229,0.08), transparent 65%), radial-gradient(ellipse 45% 40% at 15% 75%, rgba(234,88,12,0.06), transparent 65%)'
              : 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(20,184,166,0.14), transparent 65%), radial-gradient(ellipse 55% 45% at 85% 35%, rgba(99,102,241,0.13), transparent 65%), radial-gradient(ellipse 45% 40% at 15% 75%, rgba(251,146,60,0.08), transparent 65%)',
          }}
        />
      </div>

      {/* Sticky Frosted SaaS Top Navbar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
          isLight
            ? 'border-slate-200/80 bg-white/85 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)]'
            : 'border-slate-800/80 bg-[#060D16]/82'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border ${
                isLight
                  ? 'border-teal-500/35 bg-teal-50 shadow-sm'
                  : 'border-teal-400/40 bg-[#0B1626]/90 shadow-[0_0_24px_rgba(20,184,166,0.28)]'
              }`}
            >
              <AudioWaveform className="h-4.5 w-4.5 text-teal-400" />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight text-white">
                MentorSync <span className="text-teal-400">AI</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                Academic Meeting Intelligence
              </div>
            </div>
          </a>

          {/* Smooth-scroll Anchor Links */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary sections">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition hover:text-teal-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right SaaS Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-mono text-teal-300 xl:inline-flex">
              <Lock className="h-3 w-3" />
              <DecryptedText text="JWT SECURED" speed={28} revealOnHover />
            </span>

            <ThemeToggle compact />

            {!user && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-teal-200 sm:inline-flex"
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={onOpenDashboard}
              className="preserve-white inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_20px_-4px_rgba(13,148,136,0.45)] transition hover:brightness-110"
            >
              <span>{user ? 'Open Workspace' : 'Open Dashboard'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-6 lg:pt-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-[#0B1728]/85 px-4 py-1.5 text-xs font-medium backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <ShinyText speed={4}>
              Enterprise Academic Mentor–Mentee Conversation Intelligence SaaS
            </ShinyText>
          </motion.div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-6xl">
            <SplitText text="Turn Academic Mentoring Into" delay={0.05} />
            <br />
            <span className="mt-2 inline-flex min-h-[1.25em] items-center justify-center rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/15 via-indigo-500/15 to-orange-500/15 px-5 py-1">
              <GradientText>
                <RotatingText
                  texts={[
                    'NLP Summarization',
                    'Actionable Follow-Ups',
                    'Automated Documentation',
                    'Engagement Analytics',
                  ]}
                  interval={2500}
                />
              </GradientText>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            <BlurText
              text="A Django-powered meeting intelligence platform that transforms recorded mentor–mentee sessions into executive summaries, academic topic insights, prioritized follow-up tasks, and structured institutional minutes."
              delay={0.025}
            />
          </p>

          {/* TrueFocus Interactive Focus Frame */}
          <div className="mt-6 flex justify-center">
            <TrueFocus
              sentence="Capture Summarize Track Document"
              borderColor="#14B8A6"
              interval={2000}
            />
          </div>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Magnet strength={0.22}>
              <StarBorder
                color="#14B8A6"
                secondaryColor="#6366F1"
                onClick={onOpenDashboard}
              >
                <ShieldCheck className="h-4 w-4 text-teal-300" />
                <span>Open Secure Dashboard</span>
                <ArrowRight className="h-4 w-4 text-teal-200" />
              </StarBorder>
            </Magnet>

            <Magnet strength={0.22}>
              <GlareHover className="rounded-xl">
                <button
                  type="button"
                  onClick={onOpenCapture}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-6 py-3 text-sm font-semibold text-indigo-100 backdrop-blur-md transition hover:border-indigo-400/70 hover:bg-indigo-500/25"
                >
                  <Mic className="h-4 w-4 text-orange-400" />
                  Try Live Transcript Analyzer
                </button>
              </GlareHover>
            </Magnet>
          </div>
        </div>

        {/* Trusted-By Academic Departments & Labs Marquee */}
        <section className="mt-16">
          <div className="mb-4 text-center text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500">
            Designed for Forward-Thinking Academic Departments, Mentoring Cells & Research Labs
          </div>
          <div
            className="relative overflow-hidden py-3"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div className="animate-marquee gap-4">
              {[...TRUSTED_ACADEMIC_ORGS, ...TRUSTED_ACADEMIC_ORGS].map((org, idx) => (
                <div
                  key={`${org}-${idx}`}
                  className="glass-panel mx-2 inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-teal-400" />
                  <span>{org}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Platform Telemetry Bar from /api/public/stats/ */}
        <section className="relative mx-auto mt-10 max-w-5xl">
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <BorderBeam colorFrom="#14B8A6" colorTo="#6366F1" />
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-teal-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400 shadow-[0_0_10px_#14B8A6]" />
                Live Anonymized Institutional Telemetry
              </div>
              <span className="text-xs font-mono text-slate-400">
                GET /api/public/stats/
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-800/80 bg-[#07111F]/80 p-4">
                <div className="text-xs font-medium text-slate-400">Sessions Analyzed</div>
                <div className="mt-1.5 font-display text-3xl font-bold text-white">
                  <CountUp to={stats?.processed_sessions ?? 6} />
                </div>
                <div className="mt-1 text-[11px] font-mono text-teal-400">100% NLP Indexed</div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#07111F]/80 p-4">
                <div className="text-xs font-medium text-slate-400">Follow-Ups Extracted</div>
                <div className="mt-1.5 font-display text-3xl font-bold text-white">
                  <CountUp to={stats?.total_action_items ?? 24} />
                </div>
                <div className="mt-1 text-[11px] font-mono text-indigo-300">
                  {stats?.completion_rate ?? 45}% Resolved
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#07111F]/80 p-4">
                <div className="text-xs font-medium text-slate-400">Avg Engagement Index</div>
                <div className="mt-1.5 font-display text-3xl font-bold text-teal-300">
                  <CountUp to={stats?.avg_engagement_score ?? 88.4} decimals={1} suffix="%" />
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">Dialogue Balance</div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#07111F]/80 p-4">
                <div className="text-xs font-medium text-slate-400">Transcript Words Parsed</div>
                <div className="mt-1.5 font-display text-3xl font-bold text-orange-300">
                  <CountUp to={stats?.total_words_analyzed ?? 1850} />
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  {stats?.total_decisions_captured ?? 12} Key Decisions
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Spotlight Grid */}
        <section id="features" className="scroll-mt-24 mt-24">
          <div className="mb-10 text-center">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-teal-400">
              Platform Capabilities
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-4xl">
              Engineered for Structured Academic Mentoring
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <SpotlightCard key={feat.title} className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/90">
                      <Icon className={`h-5 w-5 ${feat.accent}`} />
                    </div>
                    <span className="rounded-full border border-slate-700/80 bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {feat.description}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </section>

        {/* 3-Stage Pipeline TiltedCards */}
        <section id="pipeline" className="scroll-mt-24 mt-24">
          <div className="mb-10 text-center">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-400">
              End-to-End Intelligence Workflow
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-4xl">
              From Recorded Dialogue to Academic Minutes in Milliseconds
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {workflowSteps.map((s) => {
              const Icon = s.icon;
              return (
                <TiltedCard key={s.step} maxTilt={7} className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-bold text-slate-700">
                      {s.step}
                    </span>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${s.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {s.desc}
                  </p>
                </TiltedCard>
              );
            })}
          </div>
        </section>

        {/* SaaS Pricing Section with Animated Monthly / Annual Toggle */}
        <section id="pricing" className="scroll-mt-24 mt-28">
          <div className="text-center">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-teal-400">
              Institutional SaaS Pricing
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-4xl">
              Transparent Plans for Faculty, Departments & Campuses
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Start free with zero external API keys required, then unlock unlimited NLP minutes, LMS webhooks, and campus RBAC.
            </p>

            {/* Animated Billing Toggle */}
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-[#0B1626]/90 p-1.5">
              <button
                type="button"
                onClick={() => setAnnualBilling(false)}
                className={`relative cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  !annualBilling ? 'preserve-white text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {!annualBilling && (
                  <motion.span
                    layoutId="pricing-billing-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 shadow-md"
                  />
                )}
                <span className="relative z-10">Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => setAnnualBilling(true)}
                className={`relative cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  annualBilling ? 'preserve-white text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {annualBilling && (
                  <motion.span
                    layoutId="pricing-billing-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 shadow-md"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  Annual
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      annualBilling
                        ? 'bg-white/20 text-white'
                        : 'bg-teal-500/15 text-teal-300'
                    }`}
                  >
                    Save 20%
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => {
              const displayPrice =
                tier.monthly === null
                  ? 'Custom'
                  : tier.monthly === 0
                  ? 'Free'
                  : `$${annualBilling ? tier.annual : tier.monthly}`;

              return (
                <div
                  key={tier.id}
                  className={`glass-panel relative flex flex-col justify-between overflow-hidden rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1 ${
                    tier.popular
                      ? 'ring-2 ring-teal-500/45 lg:-translate-y-2'
                      : ''
                  }`}
                >
                  {tier.popular && <BorderBeam colorFrom="#14B8A6" colorTo="#6366F1" />}

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-white">
                        {tier.name}
                      </h3>
                      {tier.popular && (
                        <span className="preserve-white rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">{tier.tagline}</p>

                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="font-display text-4xl font-extrabold text-white">
                        {displayPrice}
                      </span>
                      {tier.monthly > 0 && (
                        <span className="text-xs font-mono text-slate-400">
                          / mo {annualBilling ? '· billed annually' : ''}
                        </span>
                      )}
                    </div>

                    <ul className="mt-6 space-y-3 border-t border-slate-800/80 pt-6 text-sm text-slate-300">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    {tier.popular ? (
                      <StarBorder
                        className="w-full"
                        onClick={onOpenDashboard}
                        color="#14B8A6"
                        secondaryColor="#6366F1"
                      >
                        <span>{tier.cta}</span>
                        <ArrowRight className="h-4 w-4" />
                      </StarBorder>
                    ) : (
                      <button
                        type="button"
                        onClick={tier.id === 'starter' ? onOpenDashboard : onOpenAuth}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-teal-200"
                      >
                        <span>{tier.cta}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Security & Compliance Trust Strip */}
        <section className="mt-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPLIANCE_BADGES.map((badge) => {
              const Icon = badge.icon;
              return (
                <SpotlightCard key={badge.label} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-500/10 text-teal-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{badge.label}</div>
                      <div className="text-[11px] font-mono text-slate-400">{badge.sub}</div>
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </section>

        {/* Interactive FAQ Accordion */}
        <section id="faq" className="scroll-mt-24 mx-auto mt-24 max-w-3xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-400">
              Frequently Asked Questions
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              Architecture, Privacy & Institutional Rollout
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="glass-panel overflow-hidden rounded-2xl transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-display text-sm font-semibold text-white sm:text-base">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-teal-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-800/80 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-400">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Crisp Multi-Column SaaS Footer */}
        <footer className="mt-24 border-t border-slate-800/70 pt-12">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/40 bg-[#0B1626]">
                  <AudioWaveform className="h-4.5 w-4.5 text-teal-400" />
                </div>
                <span className="font-display text-lg font-bold text-white">
                  MentorSync <span className="text-teal-400">AI</span>
                </span>
              </div>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
                Smart Meeting Intelligence System engineered with Django REST Framework, Pure-Python TextRank/TF-IDF NLP, HS256 JWT role scoping, and React 19 + ReactBits.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 font-mono text-[11px] text-teal-300">
                <Building2 className="h-3.5 w-3.5" />
                Dept. of ECE · Anna University
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Platform
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-teal-400">NLP Summarizer</a></li>
                <li><a href="#pipeline" className="hover:text-teal-400">Capture Studio</a></li>
                <li><a href="#pricing" className="hover:text-teal-400">Institutional Plans</a></li>
                <li><a href="#faq" className="hover:text-teal-400">Compliance FAQ</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Workspace
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>
                  <button type="button" onClick={onOpenDashboard} className="cursor-pointer hover:text-teal-400">
                    Overview Dashboard
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenCapture} className="cursor-pointer hover:text-teal-400">
                    Live Transcript Studio
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenAuth} className="cursor-pointer hover:text-teal-400">
                    1-Click Role Demo Login
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Security & Stack
              </div>
              <ul className="mt-3 space-y-2 font-mono text-[11px] text-slate-400">
                <li>Django 6 + DRF (Port 8003)</li>
                <li>PyJWT HS256 Bearer Vault</li>
                <li>TextRank + TF-IDF + MMR</li>
                <li>Automated Markdown & PDF Minutes</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-800/70 pt-6 text-xs text-slate-500 sm:flex-row">
            <span>
              © {new Date().getFullYear()} <strong className="text-slate-300">MentorSync AI</strong> — Smart Meeting Intelligence System
            </span>
            <span className="font-mono text-[11px]">
              Designed & Developed by Dharshini A · Dept. of ECE, Anna University
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
