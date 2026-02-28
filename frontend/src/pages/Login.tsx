import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Rocket, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuthStore } from "@/lib/auth-store";
import { useWizardStore } from "@/lib/wizard-store";
import { loginUser, registerUser } from "@/lib/auth-api";

type Tab = "login" | "register";

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const resetWizard = useWizardStore((s) => s.reset);
  const [tab, setTab] = useState<Tab>("login");
  const formRef = useRef<HTMLDivElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regInterests, setRegInterests] = useState("");
  const [regFollowers, setRegFollowers] = useState("1000");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetStarted = () => {
    setTab("register");
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    text-foreground placeholder:text-muted-foreground/50 text-[0.9375rem]`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-display font-semibold text-foreground tracking-tight">TrendPilot</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Split layout */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row">

        {/* ── Left: Hero copy ── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-10 lg:py-16">
          <p className="text-lg text-muted-foreground italic mb-6 leading-relaxed max-w-lg">
            "Most tools create content for you — but they can't capture your voice, your expertise, or your timing."
          </p>

          <p className="text-2xl font-display font-bold text-foreground mb-10">Until now.</p>

          <div className="mb-4">
            <h1 className="text-6xl font-display font-bold tracking-tight text-primary leading-none mb-4">
              TrendPilot
            </h1>
            <p className="text-xl font-display font-medium text-foreground mb-3">
              The AI Co-Pilot for LinkedIn Users
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              Turn your interests with live Google Trends into polished LinkedIn posts — personalised to your voice, scored for engagement before you hit publish.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-10">
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold
                text-white gradient-primary glow-primary hover:opacity-90 active:opacity-80
                transition-all duration-200"
            >
              <Rocket className="w-4 h-4" />
              Get Started
            </button>

            <a
              href="https://github.com/rak13/capstone-trend-pilot-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium
                border border-border/60 text-muted-foreground
                hover:text-foreground hover:border-border hover:bg-white/5
                transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              <Star className="w-3.5 h-3.5" />
              Star on GitHub
            </a>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div
          ref={formRef}
          className="flex flex-col justify-center px-8 py-12 lg:px-10 lg:py-16
            lg:w-[44%] border-t lg:border-t-0 lg:border-l border-border/40"
        >
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 tracking-tight">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h2>

            {/* Tab switcher */}
            <div className="flex rounded-lg bg-secondary/40 p-1 mb-7 border border-border/40">
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
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
              <form onSubmit={handleLogin} className="space-y-4">
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
              <form onSubmit={handleRegister} className="space-y-4">
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
                <Field label="Interests & Topic Ideas" hint="Optional">
                  <Textarea value={regInterests} onChange={(e) => setRegInterests(e.target.value)}
                    placeholder="e.g. AI ethics, productivity, remote teams, startups…"
                    className={`min-h-[80px] resize-none ${inputClass}`} />
                </Field>
                <Field label="LinkedIn Followers" hint="Used for engagement prediction">
                  <Input type="number" value={regFollowers} onChange={(e) => setRegFollowers(e.target.value)}
                    placeholder="1000" min={0} className={`max-w-[200px] ${inputClass}`} />
                </Field>
                {error && <ErrorMsg>{error}</ErrorMsg>}
                <SubmitBtn loading={loading}>{loading ? "Creating account…" : "Create Account"}</SubmitBtn>
              </form>
            )}
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-2.5">
      {children}
    </p>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 px-4 rounded-lg text-base font-medium text-white
        gradient-primary glow-primary
        hover:opacity-90 active:opacity-80
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 mt-2"
    >
      {children}
    </button>
  );
}

export default Login;
