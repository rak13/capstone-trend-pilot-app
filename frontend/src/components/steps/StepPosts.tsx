import { useEffect, useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchPrediction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Trophy } from "lucide-react";

const StepPosts = () => {
  const { postVariants, chosenTitle, followers, predictions, setPredictions, setFinalPost, setStep } = useWizardStore();
  const [loadingPreds, setLoadingPreds] = useState(predictions.length === 0);
  const [predError, setPredError] = useState("");

  useEffect(() => {
    if (predictions.length === 0) {
      const fetchAll = async () => {
        try {
          const preds = await Promise.all(
            postVariants.map((v) => fetchPrediction(v.postText, followers, chosenTitle ?? ""))
          );
          setPredictions(preds);
        } catch (err) {
          setPredError(err instanceof Error ? err.message : "Failed to run engagement prediction.");
        } finally {
          setLoadingPreds(false);
        }
      };
      fetchAll();
    }
  }, []);

  const handleSelect = (idx: number) => {
    setFinalPost(postVariants[idx].postText);
    setStep(5);
  };

  // Find best variant
  const bestIdx = predictions.length > 0
    ? predictions.reduce((best, p, i) => (p.reactions + p.comments > predictions[best].reactions + predictions[best].comments ? i : best), 0)
    : -1;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Compare Posts & Engagement</h2>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{chosenTitle}</span>
          <br />Three hook styles generated. Engagement predicted by our model.
        </p>
      </div>

      {predError && (
        <p className="text-destructive text-sm font-medium mb-4">{predError}</p>
      )}

      {loadingPreds ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Running engagement prediction model…</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {postVariants.map((v, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-center transition-all ${
                  bestIdx === i ? "border-accent bg-accent/5" : "border-border bg-card"
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">{v.hookStyle}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Heart className="w-3.5 h-3.5 text-destructive" />
                    {predictions[i]?.reactions}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    {predictions[i]?.comments}
                  </span>
                </div>
                {bestIdx === i && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-1">
                    <Trophy className="w-3 h-3" /> Best
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Variant cards */}
          <div className="space-y-4 mb-6">
            {postVariants.map((v, i) => (
              <div
                key={i}
                className={`p-5 rounded-lg border-2 bg-card transition-all ${
                  bestIdx === i ? "border-accent/50" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-foreground">
                      Variant {i + 1} — {v.hookStyle}
                    </h3>
                    {bestIdx === i && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{v.wordCount} words</span>
                </div>

                <div className="bg-muted/50 rounded-md p-4 mb-4 max-h-52 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{v.postText}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="w-4 h-4 text-destructive" />
                      {predictions[i]?.reactions} reactions
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      {predictions[i]?.comments} comments
                    </span>
                  </div>
                  <Button
                    onClick={() => handleSelect(i)}
                    variant={bestIdx === i ? "default" : "outline"}
                    className={bestIdx === i ? "gradient-primary text-primary-foreground hover:opacity-90" : ""}
                  >
                    Select This Post
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Button variant="outline" onClick={() => { setPredictions([]); setStep(3); }} disabled={loadingPreds}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    </div>
  );
};

export default StepPosts;
