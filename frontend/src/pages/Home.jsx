import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Heart, MessageCircle, Bookmark,
  BarChart2, Sparkles, Edit3, Rss, Users, Star, BookOpen
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   SCROLL REVEAL HOOK
   ───────────────────────────────────────────────────── */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, revealed];
}

/* ─────────────────────────────────────────────────────
   MINI BAR CHART
   ───────────────────────────────────────────────────── */
const MiniBar = ({ values = [], height = 36 }) => (
  <div className="flex items-end gap-0.5" style={{ height }}>
    {values.map((v, i) => (
      <div
        key={i}
        className="flex-1 rounded-sm"
        style={{
          height: `${v}%`,
          background: v > 75 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.16)',
          boxShadow: v > 75 ? '0 0 8px rgba(255,255,255,0.35)' : 'none',
        }}
      />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────
   SVG RING CHART
   ───────────────────────────────────────────────────── */
const RingChart = ({ pct = 78, label = 'Retention' }) => {
  const r = 66;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 172, height: 172 }}>
      <svg width={172} height={172} viewBox="0 0 172 172" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="86" cy="86" r={r + 18} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 9" />
        <circle cx="86" cy="86" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
        <circle
          cx="86" cy="86" r={r} fill="none"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.55))' }}
        />
        <circle cx="86" cy="86" r={r - 22} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-white">{pct}%</span>
        <span className="text-[10px] mt-0.5 text-center leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {label}
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   LANDING NAVBAR  (always dark, transparent → blur on scroll)
   ───────────────────────────────────────────────────── */
const LandingNavbar = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(6,6,10,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(1.6)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.6)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="text-xl font-black text-white tracking-tight hover:opacity-75 transition-opacity">
            DailyPen
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.52)' }}>
            <Link to="/dashboard" className="hover:text-white transition-colors">Stories</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
            <a href="#creators" className="hover:text-white transition-colors">Creators</a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-all hover:scale-105"
              >
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-white transition-colors hidden sm:block" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-all hover:scale-105"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

/* ─────────────────────────────────────────────────────
   MARQUEE DATA
   ───────────────────────────────────────────────────── */
const STATS = [
  { val: '24.8k+', label: 'Articles Published' },
  { val: '8,200+', label: 'Active Creators' },
  { val: '1.4M+',  label: 'Monthly Readers' },
  { val: '320k+',  label: 'Bookmarks Saved' },
  { val: '6.2 min', label: 'Avg. Read Time' },
  { val: '98.7%',  label: 'Creator Satisfaction' },
];

/* ─────────────────────────────────────────────────────
   TESTIMONIALS DATA
   ───────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "DailyPen transformed how I think about writing. The editor feels like a conversation, not a chore. My audience grew 3× in 4 months.",
    name: 'Anika Sharma',
    role: 'Tech Writer & Developer',
    g: 'from-violet-500 to-purple-700',
  },
  {
    quote: "I published my first article within 10 minutes of signing up. The experience is effortless — and the design is genuinely stunning.",
    name: 'Rohan Mehta',
    role: 'Software Engineer',
    g: 'from-blue-500 to-cyan-600',
  },
  {
    quote: "The AI writing assistant broke through my creative block instantly. DailyPen is the future of thoughtful, intentional publishing.",
    name: 'Priya Nair',
    role: 'Content Creator & Storyteller',
    g: 'from-emerald-500 to-teal-600',
  },
];

/* ═══════════════════════════════════════════════════════════════
   HOME — Main Component
   ═══════════════════════════════════════════════════════════════ */
const Home = () => {
  const [featRef,  featRevealed]  = useReveal(0.08);
  const [showRef,  showRevealed]  = useReveal(0.08);
  const [testRef,  testRevealed]  = useReveal(0.08);
  const [ctaRef,   ctaRevealed]   = useReveal(0.08);

  return (
    <div style={{ background: '#06060a', color: '#ffffff' }} className="min-h-screen overflow-x-hidden">
      <LandingNavbar />

      {/* ══════════════════════════════════════════════════════
          §1  HERO
          ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-20 pb-16 overflow-hidden">

        {/* ── Background layers ── */}
        <div className="absolute inset-0 line-grid pointer-events-none" />
        {/* Radial vignette to darken edges */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 50%, transparent 0%, #06060a 78%)' }} />

        {/* Glow orb — top right */}
        <div className="absolute top-1/4 right-1/4 w-[560px] h-[560px] rounded-full pointer-events-none animate-glow" style={{ background: 'radial-gradient(circle, rgba(210,225,255,0.09) 0%, transparent 68%)', filter: 'blur(48px)' }} />
        {/* Glow orb — bottom left */}
        <div className="absolute bottom-1/4 left-1/5 w-[420px] h-[420px] rounded-full pointer-events-none animate-glow-slow" style={{ background: 'radial-gradient(circle, rgba(155,205,185,0.07) 0%, transparent 70%)', filter: 'blur(64px)' }} />

        {/* Thin accent lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />

        {/* ── FLOATING CARD 1 — Article Preview (left) ── */}
        <div className="absolute left-6 top-36 xl:left-16 xl:top-44 hidden lg:block animate-float-a" style={{ zIndex: 10 }}>
          <div className="glass rounded-2xl p-4 w-56" style={{ boxShadow: '0 28px 72px rgba(0,0,0,0.75)' }}>
            {/* Author */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">A</div>
              <div className="min-w-0">
                <p className="text-white text-[11px] font-bold">Arjun Mehta</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Trending · 6 min read</p>
              </div>
            </div>
            {/* Title */}
            <p className="text-[13px] font-bold leading-snug mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>
              "The Science Behind Great Storytelling"
            </p>
            {/* Reading progress bar */}
            <div className="rounded-full h-0.5 mb-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full w-[65%]" style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 6px rgba(255,255,255,0.4)' }} />
            </div>
            {/* Engagement */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}><Heart className="h-3 w-3" /> 2.4k</span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}><MessageCircle className="h-3 w-3" /> 186</span>
              <span className="flex items-center gap-1 text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.38)' }}><Bookmark className="h-3 w-3" /></span>
            </div>
          </div>
        </div>

        {/* ── FLOATING CARD 2 — Analytics (right) ── */}
        <div className="absolute right-6 top-32 xl:right-16 xl:top-40 hidden lg:block animate-float-b" style={{ zIndex: 10 }}>
          <div className="glass rounded-2xl p-4 w-52" style={{ boxShadow: '0 28px 72px rgba(0,0,0,0.75)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.42)' }}>This Week</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.15)', color: 'rgb(52,211,153)' }}>↑ 24%</span>
            </div>
            <p className="text-3xl font-black text-white mb-0.5">18.4k</p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Story reads</p>
            <MiniBar values={[38, 55, 45, 82, 60, 95, 72]} height={36} />
          </div>
        </div>

        {/* ── FLOATING CARD 3 — Live activity (bottom right) ── */}
        <div className="absolute right-10 bottom-24 xl:right-20 hidden xl:block animate-float-c" style={{ zIndex: 10 }}>
          <div className="glass rounded-2xl p-4 w-64" style={{ boxShadow: '0 28px 72px rgba(0,0,0,0.75)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.48)' }}>Live Activity</p>
            </div>
            {[
              { text: 'Priya bookmarked your story', t: '2s ago' },
              { text: 'Your article reached 1,000 readers', t: '18s ago' },
              { text: '12 new responses to your post', t: '2m ago' },
            ].map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.62)' }}>{a.text}</p>
                <p className="text-[10px] flex-shrink-0 mt-px" style={{ color: 'rgba(255,255,255,0.26)' }}>{a.t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER HERO CONTENT ── */}
        <div className="relative z-10 max-w-3xl mx-auto animate-hero-fade-in">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.68)' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            The modern platform for serious creators
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.04] tracking-tight mb-6">
            Write stories that<br />
            <span
              style={{
                WebkitTextFillColor: 'transparent',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.42) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >deserve attention.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            DailyPen is the modern publishing platform for writers, thinkers, and creators
            who refuse to settle for ordinary.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full text-sm font-bold hover:bg-white/90 transition-all duration-300 hover:scale-105"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.18), 0 8px 36px rgba(255,255,255,0.09)' }}
            >
              Start Writing
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.11)', color: 'rgba(255,255,255,0.82)' }}
            >
              <BookOpen className="h-4 w-4" />
              Explore Stories
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="flex items-center justify-center gap-3 mt-16" style={{ color: 'rgba(255,255,255,0.22)' }}>
            <div className="h-px w-10" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Scroll to explore</span>
            <div className="h-px w-10" style={{ background: 'rgba(255,255,255,0.12)' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2  MARQUEE — Platform stats
          ══════════════════════════════════════════════════════ */}
      <div className="relative py-5 overflow-hidden border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-28 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #06060a, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-28 z-10 pointer-events-none" style={{ background: 'linear-gradient(-90deg, #06060a, transparent)' }} />

        <div className="flex w-max animate-marquee">
          {[...STATS, ...STATS].map((s, i) => (
            <div key={i} className="flex items-center gap-5 px-7">
              <div className="text-center flex-shrink-0">
                <p className="text-lg font-black text-white leading-none">{s.val}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>{s.label}</p>
              </div>
              <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.14)' }}>◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          §3  FEATURES — Bento grid
          ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 px-5 sm:px-8" ref={featRef}>
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className={`text-center mb-16 reveal ${featRevealed ? 'revealed' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(255,255,255,0.32)' }}>
              Platform Features
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Build your creative space
            </h2>
            <p className="mt-4 text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Everything a modern creator needs — in a platform that gets out of your way.
            </p>
          </div>

          {/* ── Row 1: Large + Medium ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

            {/* Editor card (large) */}
            <div className={`lg:col-span-3 reveal reveal-delay-1 ${featRevealed ? 'revealed' : ''}`}>
              <div className="glass glass-hover rounded-2xl p-7 h-full min-h-[320px] relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />
                <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Writing
                </div>

                <div className="mb-5" style={{ color: 'rgba(255,255,255,0.46)' }}>
                  <Edit3 className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Distraction-free Editor</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.42)' }}>
                  A minimalist writing canvas built for focus. Rich formatting, built-in AI assistance, and beautiful typography — all seamlessly integrated.
                </p>

                {/* Editor mockup */}
                <div className="rounded-xl p-4 relative" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    {[1, 2, 3].map(d => <div key={d} className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.13)' }} />)}
                  </div>
                  <p className="text-sm font-bold text-white mb-2.5">The Art of Slow Mornings</p>
                  <div className="space-y-2">
                    {[100, 100, 65].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.09)', width: `${w}%` }} />
                    ))}
                    <div className="flex items-center gap-0.5 mt-1">
                      <div className="h-4 w-0.5 animate-blink" style={{ background: 'rgba(255,255,255,0.75)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized feed card (medium) */}
            <div className={`lg:col-span-2 reveal reveal-delay-2 ${featRevealed ? 'revealed' : ''}`}>
              <div className="glass glass-hover rounded-2xl p-7 h-full min-h-[320px] relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />
                <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Discovery
                </div>
                <div className="mb-5" style={{ color: 'rgba(255,255,255,0.46)' }}><Rss className="h-5 w-5" /></div>
                <h3 className="text-xl font-black text-white mb-2">Personalized Feed</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.42)' }}>
                  Stories curated to your interests and the writers you follow.
                </p>
                {/* Feed items */}
                <div className="space-y-2">
                  {[
                    { title: 'Building in Public: Year One', author: 'Maya S.', t: '5m', c: 'from-blue-500 to-cyan-600' },
                    { title: 'The Quiet Revolution of Slow Tech', author: 'Dev K.', t: '12m', c: 'from-emerald-500 to-teal-600' },
                    { title: 'Notes on Creative Confidence', author: 'Leila R.', t: '18m', c: 'from-amber-500 to-orange-600' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.c} flex items-center justify-center text-white text-[9px] font-black flex-shrink-0`}>
                        {item.author[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.32)' }}>{item.author} · {item.t} read</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Three equal cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <BarChart2 className="h-5 w-5" />,
                tag: 'Insights',
                title: 'Creator Analytics',
                desc: 'Track reads, engagement, and growth with real-time analytics built for writers.',
                delay: 'reveal-delay-2',
              },
              {
                icon: <Bookmark className="h-5 w-5" />,
                tag: 'Library',
                title: 'Reading Collections',
                desc: 'Organize and revisit stories that matter to you in curated personal libraries.',
                delay: 'reveal-delay-3',
              },
              {
                icon: <Users className="h-5 w-5" />,
                tag: 'Community',
                title: 'Creator Network',
                desc: 'Follow writers, leave responses, and build a real audience around your ideas.',
                delay: 'reveal-delay-4',
              },
            ].map((card) => (
              <div key={card.title} className={`reveal ${card.delay} ${featRevealed ? 'revealed' : ''}`}>
                <div className="glass glass-hover rounded-2xl p-6 h-full relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }} />
                  <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.36)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {card.tag}
                  </div>
                  <div className="mb-4" style={{ color: 'rgba(255,255,255,0.46)' }}>{card.icon}</div>
                  <h3 className="text-lg font-black text-white mb-2">{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §4  ANALYTICS SHOWCASE
          ══════════════════════════════════════════════════════ */}
      <section id="analytics" className="py-28 px-5 sm:px-8 relative" ref={showRef}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full animate-glow-slow" style={{ background: 'radial-gradient(circle, rgba(180,180,255,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section header */}
          <div className={`text-center mb-16 reveal ${showRevealed ? 'revealed' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(255,255,255,0.32)' }}>
              Creator Insights
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Know your audience
            </h2>
            <p className="mt-4 text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Beautiful analytics built for writers who care about impact, not vanity metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Left — Ring + progress bars */}
            <div className={`reveal reveal-delay-1 ${showRevealed ? 'revealed' : ''}`}>
              <div className="glass rounded-2xl p-7 h-full relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.32)' }}>Story Performance</p>
                <p className="text-4xl font-black text-white mb-0.5">+A3.7</p>
                <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.38)' }}>Average engagement score across all stories</p>

                <div className="flex flex-col sm:flex-row items-center gap-7">
                  <RingChart pct={78} label="Reader Retention" />

                  <div className="space-y-4 flex-1 w-full">
                    {[
                      { label: 'Story Reads', val: '18.4k', pct: 78 },
                      { label: 'Completions', val: '12.1k', pct: 52 },
                      { label: 'Responses', val: '2.3k', pct: 28 },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.42)' }}>{m.label}</span>
                          <span className="text-[11px] font-bold text-white">{m.val}</span>
                        </div>
                        <div className="rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: showRevealed ? `${m.pct}%` : '0%',
                              background: 'rgba(255,255,255,0.7)',
                              boxShadow: '0 0 6px rgba(255,255,255,0.35)',
                              transitionDelay: '0.3s',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Bar chart + two metric tiles */}
            <div className="space-y-4">
              {/* Bar chart card */}
              <div className={`glass rounded-2xl p-6 reveal reveal-delay-2 ${showRevealed ? 'revealed' : ''}`}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-sm font-black text-white">Weekly Reads</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Last 6 months</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: 'rgb(52,211,153)', border: '1px solid rgba(52,211,153,0.18)' }}>
                    ↑ 38%
                  </span>
                </div>

                {/* Bars */}
                <div className="flex items-end gap-2" style={{ height: 72 }}>
                  {[
                    { h: 42, l: 'Nov', v: '19k', hi: false },
                    { h: 70, l: 'Dec', v: '32k', hi: false },
                    { h: 100, l: 'Jan', v: '46k', hi: true },
                    { h: 28, l: 'Feb', v: '12k', hi: false },
                    { h: 60, l: 'Mar', v: '28k', hi: false },
                    { h: 85, l: 'Apr', v: '38k', hi: true },
                  ].map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.36)' }}>{b.v}</span>
                      <div
                        className="w-full rounded-t-sm transition-all duration-700"
                        style={{
                          height: showRevealed ? `${b.h * 0.62}px` : '4px',
                          background: b.hi ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.14)',
                          boxShadow: b.hi ? '0 0 14px rgba(255,255,255,0.3)' : 'none',
                          transitionDelay: `${i * 80}ms`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map(l => (
                    <p key={l} className="flex-1 text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.24)' }}>{l}</p>
                  ))}
                </div>
              </div>

              {/* Metric tiles */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Writing Streak',
                    val: '12 days',
                    sub: 'Keep it going 🔥',
                    bg: 'rgba(251,191,36,0.08)',
                    border: 'rgba(251,191,36,0.18)',
                    accent: 'rgb(251,191,36)',
                    delay: 'reveal-delay-3',
                  },
                  {
                    label: 'Top Story',
                    val: '4.2k reads',
                    sub: 'Past 30 days',
                    bg: 'rgba(139,92,246,0.08)',
                    border: 'rgba(139,92,246,0.18)',
                    accent: 'rgb(167,139,250)',
                    delay: 'reveal-delay-4',
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={`glass-hover rounded-2xl p-5 reveal ${m.delay} ${showRevealed ? 'revealed' : ''}`}
                    style={{ background: m.bg, border: `1px solid ${m.border}` }}
                  >
                    <p className="text-[11px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.42)' }}>{m.label}</p>
                    <p className="text-xl font-black text-white">{m.val}</p>
                    <p className="text-[11px] mt-1" style={{ color: m.accent }}>{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §5  TESTIMONIALS — Creator stories
          ══════════════════════════════════════════════════════ */}
      <section id="creators" className="py-28 px-5 sm:px-8" ref={testRef}>
        <div className="max-w-6xl mx-auto">

          <div className={`text-center mb-16 reveal ${testRevealed ? 'revealed' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(255,255,255,0.32)' }}>
              Creator Stories
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Loved by writers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`reveal reveal-delay-${i + 1} ${testRevealed ? 'revealed' : ''}`}>
                <div className="glass glass-hover rounded-2xl p-7 h-full relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm leading-relaxed mb-6 font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    "{t.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.g} flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.36)' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §6  CTA — Cinematic full-width
          ══════════════════════════════════════════════════════ */}
      <section className="py-36 px-5 sm:px-8 relative overflow-hidden" ref={ctaRef}>
        {/* Layered glow atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full animate-glow" style={{ background: 'radial-gradient(ellipse, rgba(200,200,255,0.05) 0%, transparent 70%)', filter: 'blur(70px)' }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className={`reveal ${ctaRevealed ? 'revealed' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-5" style={{ color: 'rgba(255,255,255,0.32)' }}>
              Free forever · No credit card
            </p>

            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.04] mb-6">
              Your story<br />
              <span
                style={{
                  WebkitTextFillColor: 'transparent',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.32))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                starts here.
              </span>
            </h2>

            <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.44)' }}>
              Join thousands of writers who use DailyPen to publish ideas that matter,
              build a real audience, and leave their mark on the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-sm font-black hover:bg-white/92 transition-all duration-300 hover:scale-105"
                style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.28), 0 8px 44px rgba(255,255,255,0.1)' }}
              >
                Start writing for free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', color: 'rgba(255,255,255,0.78)' }}
              >
                Browse all stories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §7  FOOTER — Minimal premium dark
          ══════════════════════════════════════════════════════ */}
      <footer className="border-t px-5 sm:px-8 pt-16 pb-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">

          {/* Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-xl font-black text-white mb-3">DailyPen</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.36)' }}>
                The modern publishing platform for writers and creators who care about quality.
              </p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>All systems operational</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: 'rgba(255,255,255,0.32)' }}>Product</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Dashboard', to: '/dashboard' },
                  { label: 'Write',     to: '/create-post' },
                  { label: 'Explore',   to: '/dashboard' },
                  { label: 'Bookmarks', to: '/dashboard' },
                ].map(l => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.42)' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: 'rgba(255,255,255,0.32)' }}>Company</p>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Contact', 'Privacy'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.42)' }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: 'rgba(255,255,255,0.32)' }}>Community</p>
              <ul className="space-y-2.5">
                {['Writers', 'Readers', 'Creators', 'Stories', 'Topics'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.42)' }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              © {new Date().getFullYear()} DailyPen. Built for modern creators.
            </p>
            <div className="flex items-center gap-6">
              {['Terms', 'Privacy', 'Cookies'].map(l => (
                <a key={l} href="#" className="text-[12px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.28)' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
