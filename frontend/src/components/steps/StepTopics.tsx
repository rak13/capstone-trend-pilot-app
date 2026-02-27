import { useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchPostTitles } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

const StepTopics = () => {
  const { trendingTopics, profileText, setChosenTopic, setPostTitles, setStep, setIsLoading } = useWizardStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setIsLoading(true);
    setError("");
    // When "Let AI pick" is selected, chosen_topic stays null so the LLM decides
    const topicForStore = selected || trendingTopics[0]?.topic || "";
    setChosenTopic(topicForStore);

    try {
      const titles = await fetchPostTitles(trendingTopics, profileText, selected);
      setPostTitles(titles);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post titles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Trending Topics</h2>
        <p className="text-muted-foreground">These topics were extracted from your profile and scored against Google Trends. Pick one to focus your post.</p>
      </div>

      {/* Topic cards */}
      <div className="space-y-3 mb-6">
        {/* AI pick option */}
        <button
          onClick={() => setSelected(null)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
            selected === null
              ? "border-primary bg-primary/5 shadow-card-hover"
              : "border-border bg-card hover:border-primary/30 shadow-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Let AI pick the best topic</p>
              <p className="text-sm text-muted-foreground">Our algorithm selects the highest-potential topic for engagement</p>
            </div>
          </div>
        </button>

        {trendingTopics.map((topic) => (
          <button
            key={topic.topic}
            onClick={() => setSelected(topic.topic)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selected === topic.topic
                ? "border-primary bg-primary/5 shadow-card-hover"
                : "border-border bg-card hover:border-primary/30 shadow-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-foreground">{topic.topic}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                    Score: {topic.trendScore.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Top: {topic.topQueries.slice(0, 3).join(", ")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {topic.risingQueries.map((rq) => (
                    <span
                      key={rq.query}
                      className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium"
                    >
                      {rq.query} {rq.value === "Breakout" ? "🔥" : rq.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-sm font-medium">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Generate Post Titles
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepTopics;
