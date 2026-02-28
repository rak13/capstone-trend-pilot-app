import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, ArrowLeft, MessageSquare, ThumbsUp, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { fetchUserPosts, type SavedPost } from "@/lib/auth-api";

const History = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUserPosts(token)
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts."))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "Z").toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">TrendPilot</h1>
              <p className="text-xs text-muted-foreground">LinkedIn Post Creator</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Create Post
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">My Posts</h2>
          <p className="text-muted-foreground">All posts you've published through TrendPilot.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No posts yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first post with the wizard!</p>
            <Button className="mt-4 gradient-primary text-primary-foreground hover:opacity-90" onClick={() => navigate("/")}>
              Create a Post
            </Button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    {post.title && (
                      <p className="font-display font-semibold text-foreground mb-1 truncate">{post.title}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {post.reactions}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {post.comments}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {post.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
