import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/auth-store";
import { loginUser, registerUser } from "@/lib/auth-api";

type Tab = "login" | "register";

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>("login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regInterests, setRegInterests] = useState("");
  const [regFollowers, setRegFollowers] = useState("1000");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await loginUser(loginEmail, loginPassword);
      setAuth(token, user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regName || !regEmail || !regPassword) {
      setError("Name, email, and password are required.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await registerUser(
        regEmail,
        regName,
        regPassword,
        regInterests,
        parseInt(regFollowers) || 1000,
      );
      setAuth(token, user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground leading-tight">TrendPilot</h1>
            <p className="text-xs text-muted-foreground">LinkedIn Post Creator</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Password</label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
                <Input
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                <Input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Password</label>
                <Input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Your Interests & Topic Ideas
                  <span className="text-muted-foreground font-normal ml-1">(optional — pre-fills Step 1)</span>
                </label>
                <Textarea
                  value={regInterests}
                  onChange={(e) => setRegInterests(e.target.value)}
                  placeholder="e.g. Interested in AI ethics and productivity. Thinking about writing on how AI tools are changing the way teams work."
                  className="min-h-[100px] resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  LinkedIn Followers
                  <span className="text-muted-foreground font-normal ml-1">(for engagement prediction)</span>
                </label>
                <Input
                  type="number"
                  value={regFollowers}
                  onChange={(e) => setRegFollowers(e.target.value)}
                  placeholder="1000"
                  min={0}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
