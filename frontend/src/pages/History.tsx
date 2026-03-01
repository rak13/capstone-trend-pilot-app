import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, ArrowLeft, MessageSquare, ThumbsUp, Clock, FileText, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuthStore } from "@/lib/auth-store";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchUserPosts, type SavedPost } from "@/lib/auth-api";

const History = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const resetWizard = useWizardStore((s) => s.reset);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchUserPosts(token)
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts."))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleLogout = () => { logout(); resetWizard(); navigate("/login"); };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "Z").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="nav-glass border-b border-border/50 sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-semibold text-foreground tracking-tight">TrendPilot</span>
          </div>

          <div className="flex items-center gap-1">
            {user && (
              <span className="text-base text-muted-foreground hidden sm:block mr-3">{user.name}</span>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium
                text-muted-foreground hover:text-foreground nav-btn
                transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" /> Create Post
            </button>
            <ThemeToggle />
            <button onClick={handleLogout} aria-label="Sign out"
              className="w-11 h-11 rounded-lg flex items-center justify-center
                text-muted-foreground hover:text-foreground nav-btn
                transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-semibold text-foreground mb-2 tracking-tight">My Posts</h2>
          <p className="text-base text-muted-foreground">All posts you've published through TrendPilot.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-xl p-5 text-base text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1.5">No posts yet</p>
            <p className="text-sm text-muted-foreground mb-7">Create your first post with the wizard.</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-lg text-base font-medium text-white
                gradient-primary glow-primary hover:opacity-90 transition-all"
            >
              Create a Post
            </button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <article
                key={post.id}
                className="bg-card border border-border/50 rounded-xl p-6 hover:border-border
                  transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-5 mb-4">
                  <div className="flex-1 min-w-0">
                    {post.title && (
                      <p className="text-base font-display font-semibold text-foreground mb-1.5 leading-snug">
                        {post.title}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4 text-primary/60" />
                      {post.reactions}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-accent/60" />
                      {post.comments}
                    </span>
                  </div>
                </div>
                <div className="bg-secondary/35 rounded-lg p-4 border border-border/30">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {post.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
