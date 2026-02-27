import { useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchTrendingTopics } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Users } from "lucide-react";

const StepProfile = () => {
  const { profileText, followers, setProfileText, setFollowers, setTrendingTopics, setStep, setIsLoading } = useWizardStore();
  const [bio, setBio] = useState(profileText);
  const [followerCount, setFollowerCount] = useState(followers.toString());
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!bio.trim()) {
      setError("Please share your interests before continuing.");
      return;
    }
    setError("");
    setIsLoading(true);
    const followersNum = parseInt(followerCount) || 1000;
    setProfileText(bio.trim());
    setFollowers(followersNum);

    try {
      const topics = await fetchTrendingTopics(bio.trim(), followersNum);
      setTrendingTopics(topics);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trending topics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">What's On Your Mind Today?</h2>
        <p className="text-muted-foreground">Share your interests, expertise, and what you'd like to post about — we'll surface the trending topics worth talking about.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <User className="w-4 h-4 text-primary" />
            Your Interests & Topic Ideas
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What topics are you passionate about, and what would you like to post about today?… e.g. 'Interested in AI ethics and productivity. Thinking about writing on how AI tools are changing the way teams work.'"
            className="min-h-[180px] resize-none bg-card border-border focus:ring-primary"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Users className="w-4 h-4 text-primary" />
            Followers
          </label>
          <Input
            type="number"
            value={followerCount}
            onChange={(e) => setFollowerCount(e.target.value)}
            placeholder="1000"
            min={0}
            max={10000000}
            className="bg-card border-border focus:ring-primary max-w-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">Used by the engagement prediction model</p>
        </div>

        {error && (
          <p className="text-destructive text-sm font-medium">{error}</p>
        )}

        <Button onClick={handleAnalyze} className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Analyze Trends
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepProfile;
