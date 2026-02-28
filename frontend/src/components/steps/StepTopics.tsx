import { useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchPostTitles } from "@/lib/api";
import { ArrowLeft, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

const StepTopics = () => {
  const { trendingTopics, profileText, setChosenTopic, setPostTitles, setStep, setIsLoading } = useWizardStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setIsLoading(true);
    setError("");
    const topicForStore = selected || trendingTopics[0]?.topic || "";
    setChosenTopic(topicForStore);
    try {
      const titles = await fetchPostTitles(trendingTopics, profileText, selected);
      setPostTitles(titles);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post titles. Please try again.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-semibold text-foreground mb-3 tracking-tight">Trending Topics</h2>
        <p className="text-base text-muted-foreground">
          Extracted from your profile and scored against Google Trends. Pick one to focus your post.
        </p>
      </div>

      <div className="space-y-2.5 mb-8">
        {/* AI pick */}
        <TopicCard selected={selected === null} onClick={() => setSelected(null)}>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">Let AI pick the best topic</p>
              <p className="text-sm text-muted-foreground mt-0.5">Our algorithm selects the highest-potential topic for engagement</p>
            </div>
          </div>
        </TopicCard>

        {trendingTopics.map((topic) => (
          <TopicCard key={topic.topic} selected={selected === topic.topic} onClick={() => setSelected(topic.topic)}>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-base font-medium text-foreground">{topic.topic}</p>
                  <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-primary/12 text-primary shrink-0 border border-primary/20">
                    Score {topic.trendScore.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2.5 leading-relaxed">
                  {topic.topQueries.slice(0, 3).join(" · ")}
                </p>
                {topic.risingQueries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {topic.risingQueries.slice(0, 5).map((rq) => (
                      <span key={rq.query}
                        className="text-sm px-2.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                        {rq.query} {rq.value === "Breakout" ? "🔥" : rq.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TopicCard>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <NavBtn onClick={() => setStep(1)} secondary>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </NavBtn>
        <NavBtn onClick={handleContinue}>
          Generate Post Titles <ArrowRight className="w-4 h-4 ml-2" />
        </NavBtn>
      </div>
    </div>
  );
};

function TopicCard({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? "border-primary/50 bg-primary/8 shadow-card-hover"
          : "border-border/50 bg-card hover:border-border hover:bg-white/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}

function NavBtn({ onClick, secondary, children }: {
  onClick: () => void; secondary?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
        secondary
          ? "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5"
          : "gradient-primary text-white glow-primary hover:opacity-90 active:opacity-80"
      }`}
    >
      {children}
    </button>
  );
}

export default StepTopics;
