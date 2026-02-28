import { useEffect, useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchPrediction } from "@/lib/api";
import { ArrowLeft, Heart, MessageCircle, Trophy } from "lucide-react";

const StepPosts = () => {
  const { postVariants, chosenTitle, followers, predictions, setPredictions, setFinalPost, setStep } = useWizardStore();
  const [loadingPreds, setLoadingPreds] = useState(predictions.length === 0);
  const [predError, setPredError] = useState("");

  useEffect(() => {
    if (predictions.length === 0) {
      Promise.all(postVariants.map((v) => fetchPrediction(v.postText, followers, chosenTitle ?? "")))
        .then(setPredictions)
        .catch((err) => setPredError(err instanceof Error ? err.message : "Failed to run engagement prediction."))
        .finally(() => setLoadingPreds(false));
    }
  }, []);

  const bestIdx = predictions.length > 0
    ? predictions.reduce((best, p, i) =>
        p.reactions + p.comments > predictions[best].reactions + predictions[best].comments ? i : best, 0)
    : -1;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-semibold text-foreground mb-3 tracking-tight">Compare Posts</h2>
        <p className="text-base text-muted-foreground">
          <span className="text-foreground font-medium">{chosenTitle}</span>
          <span className="mx-2 text-border">·</span>
          Three hook styles. Engagement predicted by our model.
        </p>
      </div>

      {predError && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-2.5 mb-5">
          {predError}
        </p>
      )}

      {loadingPreds ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-9 h-9 border-2 border-primary/25 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-base text-muted-foreground">Running engagement prediction model…</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {postVariants.map((v, i) => (
              <div key={i}
                className={`p-4 rounded-xl border text-center transition-all ${
                  bestIdx === i ? "border-accent/40 bg-accent/8" : "border-border/50 bg-card"
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground mb-2">{v.hookStyle}</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {predictions[i]?.reactions ?? "—"}
                  </span>
                  <span className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    {predictions[i]?.comments ?? "—"}
                  </span>
                </div>
                {bestIdx === i && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent mt-2">
                    <Trophy className="w-3.5 h-3.5" /> Best
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Variant cards */}
          <div className="space-y-4 mb-8">
            {postVariants.map((v, i) => (
              <div key={i}
                className={`p-5 rounded-xl border bg-card transition-all ${
                  bestIdx === i ? "border-accent/40" : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-display font-semibold text-foreground">
                      Variant {i + 1} — {v.hookStyle}
                    </h3>
                    {bestIdx === i && (
                      <span className="text-sm px-2.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{v.wordCount} words</span>
                </div>

                <div className="bg-secondary/40 rounded-lg p-4 mb-4 max-h-52 overflow-y-auto border border-border/30">
                  <p className="text-[0.9375rem] text-foreground/85 whitespace-pre-wrap leading-relaxed">{v.postText}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="w-4 h-4 text-rose-500" />
                      {predictions[i]?.reactions} reactions
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      {predictions[i]?.comments} comments
                    </span>
                  </div>
                  <button
                    onClick={() => { setFinalPost(v.postText); setStep(5); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      bestIdx === i
                        ? "gradient-primary text-white glow-primary hover:opacity-90"
                        : "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    Select This Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => { setPredictions([]); setStep(3); }}
        disabled={loadingPreds}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-medium
          border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
          transition-all duration-200 disabled:opacity-40"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </div>
  );
};

export default StepPosts;
