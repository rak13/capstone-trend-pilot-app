import { useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchPostVariants } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Pencil } from "lucide-react";

const StepPostTitle = () => {
  const { postTitles, profileText, setChosenTitle, setPostVariants, setStep, setIsLoading } = useWizardStore();
  const [selectedIdx, setSelectedIdx] = useState<number | "custom" | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [error, setError] = useState("");

  const resolvedTitle =
    selectedIdx === "custom"
      ? customTitle.trim()
      : selectedIdx !== null
      ? postTitles[selectedIdx].title
      : "";

  const canGenerate = selectedIdx !== null && (selectedIdx !== "custom" || customTitle.trim().length > 0);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setChosenTitle(resolvedTitle);
    setIsLoading(true);
    setError("");

    try {
      const variants = await fetchPostVariants(resolvedTitle, profileText);
      setPostVariants(variants);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate posts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Choose a Post Title</h2>
        <p className="text-muted-foreground">The AI analysed trending search signals and drafted these titles. Pick one or write your own.</p>
      </div>

      <div className="space-y-4 mb-6">
        {postTitles.map((t, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={`w-full text-left p-5 rounded-lg border-2 transition-all duration-200 ${
              selectedIdx === i
                ? "border-primary bg-primary/5 shadow-card-hover"
                : "border-border bg-card hover:border-primary/30 shadow-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                selectedIdx === i ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {selectedIdx === i ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div>
                {t.signal && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs font-medium text-muted-foreground">{t.signal}</span>
                  </div>
                )}
                <p className="font-display font-semibold text-foreground leading-snug">{t.title}</p>
              </div>
            </div>
          </button>
        ))}

        {/* Custom title option */}
        <button
          onClick={() => setSelectedIdx("custom")}
          className={`w-full text-left p-5 rounded-lg border-2 transition-all duration-200 ${
            selectedIdx === "custom"
              ? "border-primary bg-primary/5 shadow-card-hover"
              : "border-border bg-card hover:border-primary/30 shadow-card"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
              selectedIdx === "custom" ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {selectedIdx === "custom" ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3 h-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-foreground leading-snug mb-1">Write my own title</p>
              <p className="text-xs text-muted-foreground">Have a specific angle in mind? Enter it below.</p>
              {selectedIdx === "custom" && (
                <Input
                  autoFocus
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canGenerate && handleGenerate()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g. Why most productivity advice is backwards"
                  className="mt-3 bg-background border-border focus:ring-primary"
                />
              )}
            </div>
          </div>
        </button>
      </div>

      {error && (
        <p className="text-destructive text-sm font-medium mb-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Generate Posts
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepPostTitle;
