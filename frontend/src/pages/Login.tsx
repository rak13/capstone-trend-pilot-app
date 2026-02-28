import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Rocket, Star, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuthStore } from "@/lib/auth-store";
import { useWizardStore } from "@/lib/wizard-store";
import { loginUser, registerUser } from "@/lib/auth-api";

type Tab = "login" | "register";

const CREATORS = [
  {
    name: "Biraj Mishra",
    role: "Creator of TrendPilot",
    quote: "What if your next LinkedIn post didn't start with a blank page… but with what the world is already talking about?",
    body: "TrendPilot was built on that question. Most creators post when inspiration strikes — but the best posts ride the wave before it peaks. This tool fuses live trend signals with your voice, so every post you write lands at the right moment, in your words.",
  },
  {
    name: "Rakib",
    role: "LinkedIn Creator",
    quote: "What if timing wasn't luck… but a strategy you could execute every single time?",
    body: "The hardest part of posting on LinkedIn isn't writing — it's knowing when. Rakib found that trending topics change daily but the window to post on them is narrow. TrendPilot hands you that window before it closes, every single time.",
  },
  {
    name: "Joyati",
    role: "Growth Marketer",
    quote: "What if your authentic voice was exactly what the algorithm was looking for?",
    body: "Joyati had years of expertise but no playbook for turning it into content people actually read. TrendPilot matched her knowledge to what her audience was already searching — making every post feel both timely and deeply personal.",
  },
  {
    name: "Faaiz",
    role: "Startup Founder",
    quote: "What if 'I'll post tomorrow' finally became something you crossed off today?",
    body: "Faaiz knew he needed a stronger LinkedIn presence but couldn't afford hours on content. TrendPilot collapsed the process — from scattered ideas to a polished, trend-backed post — in minutes, not days.",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const resetWizard = useWizardStore((s) => s.reset);
  const [tab, setTab] = useState<Tab>("login");
  const formRef = useRef<HTMLElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regInterests, setRegInterests] = useState("");
  const [regFollowers, setRegFollowers] = useState("1000");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCreator, setActiveCreator] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveCreator((prev) => (prev + 1) % CREATORS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const handleGetStarted = () => {
    setTab("register");
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const { token, user } = await loginUser(loginEmail, loginPassword);
      resetWizard();
      setAuth(token, user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regName || !regEmail || !regPassword) { setError("Name, email, and password are required."); return; }
    setLoading(true);
    try {
      const { token, user } = await registerUser(
        regEmail, regName, regPassword, regInterests, parseInt(regFollowers) || 1000,
      );
      resetWizard();
      setAuth(token, user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally { setLoading(false); }
  };

  const inputClass = `bg-secondary/50 border-border/60 focus-visible:ring-primary/40
    text-foreground placeholder:text-muted-foreground/50 text-lg py-3`;

  return (
    <div className="bg-background">

      {/* ── Topbar ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-10 py-5 border-b border-border/30"
        style={{ background: "rgba(14,20,30,0.9)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground tracking-tight">TrendPilot</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/rak13/capstone-trend-pilot-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-display text-sm text-muted-foreground
              hover:text-foreground transition-colors duration-200"
          >
            <Github className="w-4 h-4" />
            <Star className="w-3.5 h-3.5" />
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Section 1: Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-10 py-20 relative overflow-hidden">

        {/* Background orbs */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(87,94,207,0.11) 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-[15%] right-[12%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(123,115,232,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[10%] left-[8%] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(87,94,207,0.06) 0%, transparent 70%)" }}
        />

        <div className="w-full max-w-4xl flex flex-col items-center text-center relative z-10">

          <p
            className="animate-fade-up font-display text-lg text-foreground/80 mb-5 leading-relaxed max-w-2xl"
            style={{ animationDelay: "0ms" }}
          >
            "Most tools create content for you — but they can't capture your voice, your expertise, or your timing."
          </p>

          <p
            className="animate-fade-up font-display text-3xl font-bold text-foreground mb-8"
            style={{ animationDelay: "70ms" }}
          >
            Until now.
          </p>

          <h1
            className="animate-fade-up font-display font-bold tracking-tight leading-none mb-5"
            style={{
              animationDelay: "140ms",
              fontSize: "clamp(5rem, 9vw, 8.5rem)",
              background: "linear-gradient(135deg, hsl(235,60%,72%), hsl(248,55%,82%), hsl(220,50%,76%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TrendPilot
          </h1>

          <p
            className="animate-fade-up font-display text-2xl font-medium text-foreground mb-4"
            style={{ animationDelay: "200ms" }}
          >
            The AI Co-Pilot for LinkedIn Users
          </p>

          <p
            className="animate-fade-up font-display text-lg text-muted-foreground leading-relaxed max-w-xl mb-10"
            style={{ animationDelay: "250ms" }}
          >
            Turn live Google Trends into polished LinkedIn posts — personalised to your voice, scored for engagement before you hit publish.
          </p>

          <div
            className="animate-fade-up flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "320ms" }}
          >
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-8 py-4 rounded-lg text-lg font-display font-semibold
                text-white gradient-primary glow-primary hover:opacity-90 active:opacity-80
                transition-all duration-200"
            >
              <Rocket className="w-5 h-5" />
              Get Started
            </button>
            <a
              href="https://github.com/rak13/capstone-trend-pilot-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-lg text-lg font-display font-medium
                border border-border/60 text-muted-foreground
                hover:text-foreground hover:border-border hover:bg-white/5
                transition-all duration-200"
            >
              <Github className="w-5 h-5" />
              <Star className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>

        </div>
      </section>

      {/* ── Section 2: Creator carousel ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-10 py-20 relative border-t border-border/20">

        <div className="w-full max-w-4xl">

          <p
            className="font-display text-sm text-muted-foreground/60 tracking-widest uppercase mb-10 text-center"
          >
            What our creators say
          </p>

          {/* Slide track */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeCreator * 100}%)` }}
            >
              {CREATORS.map((creator, i) => (
                <div key={i} className="w-full flex-shrink-0">
                  <div className="px-10 py-10 text-center">
                    {/* Opening quote mark — round top, pointed bottom */}
                    <div className="flex justify-center mb-8">
                      <QuoteMark className="animate-float" />
                    </div>

                    <p className="font-display text-3xl font-semibold text-foreground leading-snug mb-6">
                      {creator.quote}
                    </p>

                    <p className="font-display text-xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                      {creator.body}
                    </p>

                    <div className="flex items-center justify-center gap-4">
                      <div className="w-10 h-px bg-primary/40" />
                      <div>
                        <p
                          className="font-display text-lg font-semibold leading-tight"
                          style={{
                            background: "linear-gradient(135deg, hsl(235,60%,72%), hsl(248,55%,82%))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >{creator.name}</p>
                        <p className="font-display text-base text-muted-foreground">{creator.role}</p>
                      </div>
                      <div className="w-10 h-px bg-primary/40" />
                    </div>

                    {/* Closing quote mark — pointed top, round bottom (flipped) */}
                    <div className="flex justify-center mt-8">
                      <QuoteMark flip className="animate-float" style={{ animationDelay: "2s" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2.5 mt-7">
            {CREATORS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveCreator(i)}
                aria-label={`Creator ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeCreator
                    ? "w-7 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* ── Section: The problem ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-10 py-24 border-t border-border/20">
        <div className="w-full max-w-4xl">

          {/* Headline */}
          <h2 className="font-display text-5xl font-bold text-foreground leading-tight mb-14 text-center">
            The way we create LinkedIn content today is{" "}
            <span style={{ color: "hsl(0,72%,60%)" }}>broken</span>
          </h2>

          {/* Today we... + card row */}
          <div className="flex items-center gap-10 mb-16">

            {/* Left: Today we list */}
            <div className="flex-1">
              <p className="font-display text-base font-semibold text-foreground/60 mb-5">Today we…</p>
              <div className="space-y-4">
                {[
                  "Chase trends after they've already peaked",
                  "Paste prompts into AI and hope for the best",
                  "Post inconsistently and wonder why reach drops",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="font-display text-lg text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: "It breaks" card — centered vertically */}
            <div
              className="rounded-xl px-7 py-6 min-w-[240px]"
              style={{ background: "rgba(180,30,30,0.15)", border: "1px solid rgba(180,30,30,0.25)" }}
            >
              <p className="font-display text-lg font-medium text-foreground mb-1">This works for one post.</p>
              <p className="font-display text-lg font-semibold" style={{ color: "hsl(0,72%,60%)" }}>
                It breaks for a presence.
              </p>
            </div>

          </div>

          {/* Comparison grid */}
          <div className="grid grid-cols-2 gap-4">

            {/* Column headers */}
            <p className="font-display text-sm font-semibold tracking-widest uppercase text-muted-foreground/50 text-center mb-2">
              TODAY
            </p>
            <p className="font-display text-sm font-semibold tracking-widest uppercase text-center mb-2"
              style={{
                background: "linear-gradient(135deg, hsl(235,60%,72%), hsl(248,55%,82%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              WITH TRENDPILOT
            </p>

            {/* Row pairs */}
            {[
              ["Scroll endlessly for ideas",        "Live Google Trends, surfaced for you"],
              ["Generic AI output, no voice",        "Posts shaped by your voice & expertise"],
              ["Blind engagement guessing",          "Engagement scored before you publish"],
              ["Manual trend research",              "Trend signals matched to your niche"],
              ["Post and pray strategy",             "Timed posts that ride the wave early"],
              ["No feedback, no signal",             "Observable performance, by design"],
            ].map(([bad, good]) => (
              <>
                <div
                  key={bad}
                  className="rounded-xl border border-border/25 bg-card/20 py-4 px-6 text-center"
                >
                  <p className="font-display text-base text-muted-foreground/50">{bad}</p>
                </div>
                <div
                  key={good}
                  className="rounded-xl border border-primary/25 py-4 px-6 text-center"
                  style={{ background: "rgba(87,94,207,0.08)" }}
                >
                  <p className="font-display text-base text-foreground">{good}</p>
                </div>
              </>
            ))}

          </div>
        </div>
      </section>

      {/* ── Section 3: Form ── */}
      <section
        ref={formRef}
        className="min-h-screen flex flex-col items-center justify-center px-10 py-20 border-t border-border/20"
      >
        <div className="w-full max-w-lg">

          <h2 className="font-display text-4xl font-semibold text-foreground mb-2 tracking-tight text-center">
            { (
              <>Get started in{" "}<span className="text-primary">60 seconds</span></>
            ) }
          </h2>
          <p className="font-display text-lg text-muted-foreground text-center mb-8">
            {tab === "login" ? "Welcome back — pick up where you left off." : "Join thousands of creators already using TrendPilot."}
          </p>

          {/* Tab switcher */}
          <div className="flex rounded-lg bg-secondary/40 p-1 mb-7 border border-border/40">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-3 font-display text-lg font-medium rounded-md transition-all duration-200 ${
                  tab === t
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <Field label="Email">
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" className={inputClass} />
              </Field>
              <Field label="Password">
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" className={inputClass} />
              </Field>
              {error && <ErrorMsg>{error}</ErrorMsg>}
              <SubmitBtn loading={loading}>{loading ? "Signing in…" : "Sign In"}</SubmitBtn>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <Field label="Full Name">
                <Input value={regName} onChange={(e) => setRegName(e.target.value)}
                  placeholder="Jane Smith" autoComplete="name" className={inputClass} />
              </Field>
              <Field label="Email">
                <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" className={inputClass} />
              </Field>
              <Field label="Password">
                <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" className={inputClass} />
              </Field>
              <Field label="Interests & Topics" hint="Optional">
                <Textarea value={regInterests} onChange={(e) => setRegInterests(e.target.value)}
                  placeholder="e.g. AI ethics, productivity, remote teams, startups…"
                  className={`min-h-[80px] resize-none ${inputClass}`} />
              </Field>
              <Field label="LinkedIn Followers" hint="For engagement prediction">
                <Input type="number" value={regFollowers} onChange={(e) => setRegFollowers(e.target.value)}
                  placeholder="1000" min={0} className={inputClass} />
              </Field>
              {error && <ErrorMsg>{error}</ErrorMsg>}
              <SubmitBtn loading={loading}>{loading ? "Creating account…" : "Create Account"}</SubmitBtn>
            </form>
          )}

        </div>
      </section>

    </div>
  );
};

function QuoteMark({ flip = false, className = "", style }: { flip?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ transform: flip ? "rotate(180deg)" : undefined, display: "inline-block" }}>
      <svg
        viewBox="0 0 48 80"
        width="60"
        height="40"
        fill="currentColor"
        aria-hidden="true"
        className={`text-primary/35 ${className}`}
        style={style}
      >
        {/* Left teardrop — round top, tapers to a point at bottom */}
        <path d="M 10,0 C 20,0 20,28 10,80 C 0,28 0,0 10,0 Z" />
        {/* Right teardrop — round top, tapers to a point at bottom */}
        <path d="M 38,0 C 48,0 48,28 38,80 C 28,28 28,0 38,0 Z" />
      </svg>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="font-display text-lg font-medium text-foreground">{label}</label>
        {hint && <span className="font-display text-base text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-lg text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-3">
      {children}
    </p>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-4 px-4 rounded-lg text-xl font-display font-semibold text-white
        gradient-primary glow-primary
        hover:opacity-90 active:opacity-80
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 mt-1"
    >
      {children}
    </button>
  );
}

export default Login;
