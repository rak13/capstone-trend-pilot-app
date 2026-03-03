import { useState } from "react";
import { useWizardStore } from "@/lib/wizard-store";
import { fetchPostVariants } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Pencil } from "lucide-react";

const StepPostTitle = () => {
  const { postTitles, profileText, selectedModel, setChosenTitle, setPostVariants, setStep, setIsLoading } = useWizardStore();
  const [selectedIdx, setSelectedIdx] = useState<number | "custom" | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [error, setError] = useState("");

  const resolvedTitle =
    selectedIdx === "custom" ? customTitle.trim()
    : selectedIdx !== null ? postTitles[selectedIdx].title
    : "";

  const canGenerate = selectedIdx !== null && (selectedIdx !== "custom" || customTitle.trim().length > 0);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setChosenTitle(resolvedTitle);
    setIsLoading(true);
    setError("");
    try {
      const variants = await fetchPostVariants(resolvedTitle, profileText, selectedModel);
      setPostVariants(variants);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate posts. Please try again.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-semibold text-foreground mb-3 tracking-tight">Choose a Post Title</h2>
        <p className="text-lg text-muted-foreground">
          The AI analysed trending signals and drafted these titles. Pick one or write your own.
        </p>
      </div>

      <div className="space-y-2.5 mb-8">
        {postTitles.map((t, i) => (
          <button key={i} onClick={() => setSelectedIdx(i)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
              selectedIdx === i
                ? "border-primary/50 bg-primary/8"
                : "border-border/50 bg-card hover:border-border hover:bg-white/[0.03]"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
                selectedIdx === i ? "gradient-primary text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {selectedIdx === i ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                {t.signal && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span className="text-base text-muted-foreground">{t.signal}</span>
                  </div>
                )}
                <p className="text-base font-display font-semibold text-foreground leading-snug">{t.title}</p>
              </div>
            </div>
          </button>
        ))}

        {/* Custom */}
        <button onClick={() => setSelectedIdx("custom")}
          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
            selectedIdx === "custom"
              ? "border-primary/50 bg-primary/8"
              : "border-border/50 bg-card hover:border-border hover:bg-white/[0.03]"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
              selectedIdx === "custom" ? "gradient-primary text-white" : "bg-secondary text-muted-foreground"
            }`}>
              {selectedIdx === "custom" ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3 h-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-display font-semibold text-foreground mb-0.5">Write my own title</p>
              <p className="text-sm text-muted-foreground">Have a specific angle in mind?</p>
              {selectedIdx === "custom" && (
                <Input
                  autoFocus
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canGenerate && handleGenerate()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g. Why most productivity advice is backwards"
                  className="mt-3 bg-secondary/40 border-border/60 focus-visible:ring-primary/40
                    text-foreground placeholder:text-muted-foreground/50 text-[0.9375rem]"
                />
              )}
            </div>
          </div>
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <NavBtn onClick={() => setStep(2)} secondary>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </NavBtn>
        <NavBtn onClick={handleGenerate} disabled={!canGenerate}>
          Generate Posts <ArrowRight className="w-4 h-4 ml-2" />
        </NavBtn>
      </div>
    </div>
  );
};

function NavBtn({ onClick, secondary, disabled, children }: {
  onClick: () => void; secondary?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center px-5 py-2.5 rounded-lg text-base font-medium
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
        secondary
          ? "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5"
          : "gradient-primary text-white glow-primary hover:opacity-90 active:opacity-80"
      }`}
    >
      {children}
    </button>
  );
}

export default StepPostTitle;
