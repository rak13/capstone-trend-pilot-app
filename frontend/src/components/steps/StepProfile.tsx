import { useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { useAuthStore } from "@/lib/auth-store";
import { fetchTrendingTopics } from "@/lib/api";
import { updateProfile } from "@/lib/auth-api";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Users } from "lucide-react";

const StepProfile = () => {
  const { profileText, followers, setProfileText, setFollowers, setTrendingTopics, setStep, setIsLoading } = useWizardStore();
  const { token, user, updateUser } = useAuthStore();

  const defaultBio = profileText || user?.interests || "";
  const defaultFollowers = profileText ? followers : (user?.followers ?? 1000);

  const [bio, setBio] = useState(defaultBio);
  const [followerCount, setFollowerCount] = useState(defaultFollowers.toString());
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!bio.trim()) { setError("Please share your interests before continuing."); return; }
    setError("");
    setIsLoading(true);
    const followersNum = parseInt(followerCount) || 1000;
    setProfileText(bio.trim());
    setFollowers(followersNum);
    if (token) updateProfile(token, bio.trim(), followersNum).then(updateUser).catch(() => {});
    try {
      const topics = await fetchTrendingTopics(bio.trim(), followersNum);
      setTrendingTopics(topics);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trending topics. Please try again.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-semibold text-foreground mb-3 tracking-tight">
          What's on your mind?
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Share your interests and what you'd like to post about — we'll surface the trending topics worth talking about.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <User className="w-4 h-4" />
            Your Interests & Topic Ideas
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={"What topics are you passionate about, and what would you like to post about today?\n\ne.g. 'Interested in AI ethics and productivity. Thinking about writing on how AI tools are changing the way teams work.'"}
            className="min-h-[160px] resize-none bg-secondary/40 border-border/60
              focus-visible:ring-primary/40 text-foreground placeholder:text-muted-foreground/40
              text-[0.9375rem] leading-relaxed"
          />
          {user?.interests && !profileText && (
            <p className="text-sm text-muted-foreground/70 mt-2">Pre-filled from your profile — feel free to edit.</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            LinkedIn Followers
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={followerCount}
              onChange={(e) => setFollowerCount(e.target.value)}
              placeholder="1000"
              min={0}
              max={10000000}
              className="bg-secondary/40 border-border/60 focus-visible:ring-primary/40
                text-foreground placeholder:text-muted-foreground/50 max-w-[160px] text-[0.9375rem]"
            />
            <span className="text-sm text-muted-foreground">Used by the engagement prediction model</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium text-white
            gradient-primary glow-primary hover:opacity-90 active:opacity-80
            transition-all duration-200"
        >
          Analyze Trends
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StepProfile;
