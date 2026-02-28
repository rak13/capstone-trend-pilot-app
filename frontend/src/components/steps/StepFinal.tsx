import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWizardStore } from "@/lib/wizard-store";
import { useAuthStore } from "@/lib/auth-store";
import { fetchVisual, fetchRefinePost } from "@/lib/api";
import { savePost } from "@/lib/auth-api";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, Copy, Edit2, Loader2, RefreshCw, RotateCw,
  Sparkles, Undo2, X, BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";

const StepFinal = () => {
  const navigate = useNavigate();
  const { finalPost, chosenTitle, predictions, reset } = useWizardStore();
  const { token } = useAuthStore();

  const [editedPost, setEditedPost] = useState(finalPost ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(finalPost ?? "");

  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    const tok = { cancelled: false };
    abortRef.current = tok;
    setVisualLoading(true);
    setVisualError(null);
    setVisualImageData(null);
    fetchVisual(postToUse, prompt || undefined)
      .then((r) => {
        if (tok.cancelled) return;
        if (r.error) setVisualError(r.error);
        else if (r.image_data) { setVisualImageData(r.image_data); setVisualContentType(r.content_type || "image/png"); }
        else setVisualError("No image was generated.");
      })
      .catch((e) => { if (!tok.cancelled) setVisualError(e instanceof Error ? e.message : "Visual generation failed."); })
      .finally(() => { if (!tok.cancelled) setVisualLoading(false); });
  };

  useEffect(() => {
    generateVisual();
    return () => { abortRef.current.cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedPost);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePost = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const latest = predictions[predictions.length - 1];
      await savePost(token, chosenTitle ?? "", editedPost, latest?.reactions ?? 0, latest?.comments ?? 0);
      setSaved(true);
      toast.success("Post saved to My Posts!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save post.");
    } finally { setSaving(false); }
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
    } finally { setRefineLoading(false); }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 glow-primary">
          <Check className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-display font-semibold text-foreground mb-2 tracking-tight">Your post is ready</h2>
        <p className="text-base text-muted-foreground">Copy it and paste directly into LinkedIn.</p>
      </div>

      {/* Post card */}
      <div className="bg-card border border-border/60 rounded-xl p-6 mb-4">
        {chosenTitle && (
          <p className="text-base font-display font-semibold text-foreground mb-4 pb-4 border-b border-border/40">
            {chosenTitle}
          </p>
        )}
        {isEditing ? (
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="min-h-[220px] resize-none bg-secondary/40 border-border/60 focus-visible:ring-primary/40
              text-foreground leading-relaxed text-[0.9375rem]"
            autoFocus
          />
        ) : (
          <div className="bg-secondary/30 rounded-lg p-5">
            <p className="text-[0.9375rem] text-foreground whitespace-pre-wrap leading-relaxed">{editedPost}</p>
          </div>
        )}
      </div>

      {/* Edit toolbar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {isEditing ? (
          <>
            <ToolBtn onClick={() => { setEditedPost(draftText); setIsEditing(false); }} primary>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Save
            </ToolBtn>
            <ToolBtn onClick={() => { setDraftText(editedPost); setIsEditing(false); }}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
            </ToolBtn>
          </>
        ) : (
          <>
            <ToolBtn onClick={() => { setDraftText(editedPost); setIsEditing(true); }}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </ToolBtn>
            {editedPost !== finalPost && (
              <ToolBtn onClick={() => { setEditedPost(finalPost ?? ""); setDraftText(finalPost ?? ""); }}>
                <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Reset
              </ToolBtn>
            )}
          </>
        )}
      </div>

      {/* AI Refine */}
      <div className="bg-secondary/25 border border-border/40 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Refine with AI</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Give an instruction and the AI will revise while keeping your voice.</p>
        <div className="flex gap-2.5">
          <input
            type="text"
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !refineLoading && handleRefine()}
            placeholder='"Make it more concise" or "Add a stronger hook"'
            className="flex-1 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm
              text-foreground placeholder:text-muted-foreground/45
              focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={refineLoading}
          />
          <button
            onClick={handleRefine}
            disabled={refineLoading || !refineInstruction.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium
              border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {refineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {refineLoading ? "Refining…" : "Apply"}
          </button>
        </div>
        {refineError && <p className="text-sm text-destructive mt-2">{refineError}</p>}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        <button onClick={handleCopy}
          className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium text-white
            gradient-primary glow-primary hover:opacity-90 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>

        {token && (
          <button
            onClick={saved ? () => navigate("/history") : handleSavePost}
            disabled={saving}
            className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
              border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkCheck className="w-4 h-4" />}
            {saved ? "View My Posts" : saving ? "Saving…" : "Publish & Save"}
          </button>
        )}

        <button onClick={reset}
          className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
            border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
            transition-all"
        >
          <RotateCw className="w-4 h-4" /> Start Over
        </button>
      </div>

      {/* Visual */}
      <div className="border-t border-border/40 pt-8">
        <h3 className="text-lg font-display font-semibold text-foreground mb-1.5 text-center">Visual</h3>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Generated from your post content. Override below to guide the image.
        </p>

        <div className="flex gap-2.5 mb-5">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !visualLoading && generateVisual(customPrompt || undefined)}
            placeholder="Custom image prompt (optional)"
            className="flex-1 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm
              text-foreground placeholder:text-muted-foreground/45
              focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={visualLoading}
          />
          <button
            onClick={() => generateVisual(customPrompt || undefined)}
            disabled={visualLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium
              border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
              disabled:opacity-40 transition-all"
          >
            {visualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {visualLoading ? "Generating…" : "Regenerate"}
          </button>
        </div>

        {visualError && <p className="text-sm text-destructive text-center mb-4">{visualError}</p>}

        {visualLoading && !visualImageData && (
          <div className="flex items-center justify-center gap-2.5 text-muted-foreground py-12">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generating visual…</span>
          </div>
        )}

        {visualImageData && (
          <div className="rounded-xl overflow-hidden border border-border/50">
            <img
              src={`data:${visualContentType};base64,${visualImageData}`}
              alt="Generated visual"
              className="w-full object-contain max-h-[480px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

function ToolBtn({ onClick, primary, children }: {
  onClick: () => void; primary?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        primary
          ? "gradient-primary text-white glow-primary hover:opacity-90"
          : "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

export default StepFinal;
