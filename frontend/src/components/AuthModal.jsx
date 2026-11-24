import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import ThemeToggle from './ThemeToggle';
import { BorderBeam, DecryptedText, DotGrid, GradientText, StarBorder, Waves } from './reactbits';

const DEMO_ACCOUNTS = [
  {
    label: 'Faculty Mentor',
    name: 'Dr. Anitha Raman',
    sub: 'ECE Faculty Advisor',
    email: 'mentor@mentorsync.edu',
    password: 'Mentor@123',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    icon: UserCheck,
  },
  {
    label: 'Student Mentee',
    name: 'Dharshini A',
    sub: 'B.E. ECE · CGPA 8.2',
    email: 'dharshini@mentorsync.edu',
    password: 'Mentee@123',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    icon: GraduationCap,
  },
  {
    label: 'Coordinator',
    name: 'Prof. Rajesh S.',
    sub: 'Academic Cell Admin',
    email: 'coordinator@mentorsync.edu',
    password: 'Coord@123',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    icon: Users,
  },
];

export default function AuthModal({ onAuthenticated, onBackToSplash }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('dharshini@mentorsync.edu');
  const [password, setPassword] = useState('Mentee@123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('MENTEE');
  const [department, setDepartment] = useState('Electronics & Communication Engineering');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register({
              email,
              password,
              full_name: fullName,
              role,
              department,
            });
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (acct) => {
    setError('');
    setEmail(acct.email);
    setPassword(acct.password);
    setMode('login');
    setLoading(true);
    try {
      const data = await api.login(acct.email, acct.password);
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Demo login failed — verify Django backend is running on port 8003.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060D16] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 z-0">
        <DotGrid gap={34} />
        <Waves lineColor="rgba(20,184,166,0.16)" secondaryColor="rgba(99,102,241,0.12)" yGap={46} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToSplash}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-teal-500/40 hover:text-teal-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Splash Overview
          </button>
          <ThemeToggle compact />
        </div>

        <div className="glass-panel relative grid overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-12">
          <BorderBeam colorFrom="#14B8A6" colorTo="#6366F1" />

          {/* Left Panel: 1-Click Role Demo Chips */}
          <div className="flex flex-col justify-between border-b border-slate-800/80 bg-[#081322]/90 p-7 lg:col-span-5 lg:border-b-0 lg:border-r">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[11px] font-mono text-teal-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <DecryptedText text="HS256 JWT AUTH GATE" speed={25} />
              </div>

              <h2 className="mt-4 font-display text-2xl font-bold text-white">
                <GradientText>Secure Academic Portal</GradientText>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Sign in to access encrypted mentoring transcripts, NLP summarization workflows, and
                role-scoped academic documentation.
              </p>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                  1-Click Instant Demo Access
                </div>

                <div className="space-y-2.5">
                  {DEMO_ACCOUNTS.map((acct) => {
                    const Icon = acct.icon;
                    return (
                      <button
                        key={acct.email}
                        type="button"
                        disabled={loading}
                        onClick={() => handleDemoLogin(acct)}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-[#0B1728]/90 p-3 text-left transition hover:border-teal-400/50 hover:bg-[#0F2036] disabled:opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${acct.badge}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-teal-200">
                              {acct.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{acct.sub}</div>
                          </div>
                        </div>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-semibold ${acct.badge}`}>
                          {acct.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-teal-300">
                <Lock className="h-3 w-3" />
                Protected DRF Session Security
              </div>
              <p className="mt-1 leading-relaxed text-slate-500">
                Tokens expire in 48h. Confidential counseling records are restricted to authorized
                session participants & coordinators.
              </p>
            </div>
          </div>

          {/* Right Panel: Login / Register Form */}
          <div className="p-7 sm:p-9 lg:col-span-7">
            <div className="mb-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold transition ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-teal-500/25 to-indigo-500/25 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In with JWT
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold transition ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-teal-500/25 to-indigo-500/25 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Academic Account
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Dharshini A"
                      className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-300">
                        Academic Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-teal-400"
                      >
                        <option value="MENTEE">Student Mentee</option>
                        <option value="MENTOR">Faculty Mentor</option>
                        <option value="COORDINATOR">Academic Coordinator</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-300">
                        Department
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-teal-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@mentorsync.edu"
                    className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <StarBorder
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  color="#14B8A6"
                  secondaryColor="#6366F1"
                >
                  {mode === 'login' ? (
                    <ShieldCheck className="h-4 w-4 text-teal-400" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-teal-400" />
                  )}
                  <span>
                    {loading
                      ? 'Verifying JWT Credentials...'
                      : mode === 'login'
                      ? 'Sign In to Secure Dashboard'
                      : 'Register & Issue JWT Token'}
                  </span>
                </StarBorder>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
