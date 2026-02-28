import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWizardStore } from "@/lib/wizard-store";
import { useAuthStore } from "@/lib/auth-store";
import { fetchVisual, fetchRefinePost } from "@/lib/api";
import { savePost } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Edit2, Loader2, RefreshCw, RotateCw, Rocket, Sparkles, Undo2, X, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

const StepFinal = () => {
  const navigate = useNavigate();
  const { finalPost, chosenTitle, predictions, reset } = useWizardStore();
  const { token } = useAuthStore();

  // ── Post editing ────────────────────────────────────────────────────────────
  const [editedPost, setEditedPost] = useState(finalPost ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(finalPost ?? "");

  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Visual generation ───────────────────────────────────────────────────────
  const [customPrompt, setCustomPrompt] = useState("");
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualImageData, setVisualImageData] = useState<string | null>(null);
  const [visualContentType, setVisualContentType] = useState("image/png");
  const [visualError, setVisualError] = useState<string | null>(null);

  const abortRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const generateVisual = (prompt?: string, postOverride?: string) => {
    const postToUse = postOverride ?? editedPost ?? finalPost;
    if (!postToUse) return;

    abortRef.current.cancelled = true;
    const token = { cancelled: false };
    abortRef.current = token;

    setVisualLoading(true);
    setVisualError(null);
    setVisualImageData(null);

    fetchVisual(postToUse, prompt || undefined)
      .then((result) => {
        if (token.cancelled) return;
        if (result.error) {
          setVisualError(result.error);
        } else if (result.image_data) {
          setVisualImageData(result.image_data);
          setVisualContentType(result.content_type || "image/png");
        } else {
          setVisualError("No image was generated.");
        }
      })
      .catch((err) => {
        if (token.cancelled) return;
        setVisualError(err instanceof Error ? err.message : "Visual generation failed.");
      })
      .finally(() => {
        if (!token.cancelled) setVisualLoading(false);
      });
  };

  // Auto-generate on mount
  useEffect(() => {
    generateVisual();
    return () => { abortRef.current.cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedPost);
    setCopied(true);
    toast.success("Post copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSave = () => {
    setEditedPost(draftText);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setDraftText(editedPost);
    setIsEditing(false);
  };

  const handleReset = () => {
    setEditedPost(finalPost ?? "");
    setDraftText(finalPost ?? "");
    setIsEditing(false);
    toast.success("Post reset to original.");
  };

  const handleSavePost = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const latestPrediction = predictions[predictions.length - 1];
      await savePost(
        token,
        chosenTitle ?? "",
        editedPost,
        latestPrediction?.reactions ?? 0,
        latestPrediction?.comments ?? 0,
      );
      setSaved(true);
      toast.success("Post saved to My Posts!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim()) return;
    setRefineLoading(true);
    setRefineError(null);
    try {
      const refined = await fetchRefinePost(editedPost, refineInstruction.trim());
      setEditedPost(refined);
      setDraftText(refined);
      setRefineInstruction("");
      toast.success("Post updated!");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Refinement failed.");
    } finally {
      setRefineLoading(false);
    }
  };

  const handleVisualRegenerate = () => {
    generateVisual(customPrompt.trim() || undefined);
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-accent-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Your Post is Ready!</h2>
        <p className="text-muted-foreground">Copy it and paste it directly into LinkedIn.</p>
      </div>

      {/* ── Post card ────────────────────────────────────────────────────────── */}
      <div className="bg-card border-2 border-border rounded-lg p-6 mb-3">
        <p className="font-display font-semibold text-foreground mb-4">{chosenTitle}</p>

        {isEditing ? (
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="min-h-[220px] resize-none bg-background border-border focus:ring-primary text-foreground leading-relaxed"
            autoFocus
          />
        ) : (
          <div className="bg-muted/50 rounded-md p-5">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{editedPost}</p>
          </div>
        )}
      </div>

      {/* ── Edit toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {isEditing ? (
          <>
            <Button size="sm" onClick={handleEditSave} className="gradient-primary text-primary-foreground hover:opacity-90">
              <Check className="w-3.5 h-3.5 mr-1.5" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleEditCancel}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => { setDraftText(editedPost); setIsEditing(true); }}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            {editedPost !== finalPost && (
              <Button size="sm" variant="outline" onClick={handleReset}>
                <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Reset to original
              </Button>
            )}
          </>
        )}
      </div>

      {/* ── AI Refine ────────────────────────────────────────────────────────── */}
      <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Refine with AI</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Give an instruction and the AI will update the post while keeping your voice and style.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !refineLoading && handleRefine()}
            placeholder='e.g. "Make it more concise" or "Add a stronger hook"'
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={refineLoading}
          />
          <Button
            onClick={handleRefine}
            disabled={refineLoading || !refineInstruction.trim()}
            variant="outline"
            size="default"
          >
            {refineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-2">{refineLoading ? "Refining…" : "Apply"}</span>
          </Button>
        </div>
        {refineError && (
          <p className="text-destructive text-xs mt-2">{refineError}</p>
        )}
      </div>

      {/* ── Copy / Save / Start Over ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <Button
          onClick={handleCopy}
          size="lg"
          className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>
        {token && (
          <Button
            variant="outline"
            size="lg"
            onClick={saved ? () => navigate("/history") : handleSavePost}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BookmarkCheck className="w-4 h-4 mr-2" />
            )}
            {saved ? "View My Posts" : saving ? "Saving…" : "Publish & Save"}
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={reset}>
          <RotateCw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>

      {/* ── Visual generation ────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-1 text-center">Visual</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Generated from your post content. Override below to guide the image.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !visualLoading && handleVisualRegenerate()}
            placeholder="Custom image prompt (optional)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={visualLoading}
          />
          <Button
            onClick={handleVisualRegenerate}
            disabled={visualLoading}
            variant="outline"
            size="default"
          >
            {visualLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">{visualLoading ? "Generating…" : "Regenerate"}</span>
          </Button>
        </div>

        {visualError && (
          <p className="text-destructive text-sm text-center font-medium mb-3">{visualError}</p>
        )}

        {visualLoading && !visualImageData && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-10">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generating visual…</span>
          </div>
        )}

        {visualImageData && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={`data:${visualContentType};base64,${visualImageData}`}
              alt="Generated visual for LinkedIn post"
              className="w-full object-contain max-h-[480px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StepFinal;
