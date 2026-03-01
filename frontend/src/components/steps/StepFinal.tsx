import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWizardStore } from "@/lib/wizard-store";
import { useAuthStore } from "@/lib/auth-store";
import { fetchVisual, fetchRefinePost, fetchPrediction, type EngagementPrediction } from "@/lib/api";
import { savePost, publishToLinkedIn, checkLinkedInStatus } from "@/lib/auth-api";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Check, Copy, Edit2, Heart, Linkedin, Loader2, MessageCircle,
  RefreshCw, RotateCw, Sparkles, Undo2, X, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const LI_CLIENT_ID   = "86ntx29ps8h86s";
const LI_REDIRECT    = import.meta.env.VITE_LINKEDIN_REDIRECT_URI as string;
const LI_SCOPE       = "openid profile w_member_social";

const StepFinal = () => {
  const navigate = useNavigate();
  const { finalPost, chosenTitle, predictions, followers, reset, setStep } = useWizardStore();
  const { token, linkedinConnected, setLinkedIn, clearLinkedIn } = useAuthStore();

  const [editedPost, setEditedPost] = useState(finalPost ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(finalPost ?? "");

  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [linkedinPostUrl, setLinkedinPostUrl] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const [currentPrediction, setCurrentPrediction] = useState<EngagementPrediction | null>(
    predictions.length > 0 ? predictions[predictions.length - 1] : null,
  );
  const [predicting, setPredicting] = useState(predictions.length === 0);
  const [predError, setPredError] = useState<string | null>(null);

  const runPrediction = (text: string) => {
    setPredicting(true);
    setPredError(null);
    fetchPrediction(text, followers, chosenTitle ?? "")
      .then(setCurrentPrediction)
      .catch((e) => setPredError(e instanceof Error ? e.message : "Prediction failed."))
      .finally(() => setPredicting(false));
  };

  useEffect(() => {
    if (predictions.length === 0 && finalPost) runPrediction(finalPost);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleCopyImage = async () => {
    if (!visualImageData) return;
    try {
      const blob = await fetch(`data:${visualContentType};base64,${visualImageData}`).then((r) => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopiedImage(true);
      toast.success("Image copied to clipboard!");
      setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      toast.error("Failed to copy image — try right-clicking and copying manually.");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedPost);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
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
      runPrediction(refined);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Refinement failed.");
    } finally { setRefineLoading(false); }
  };

  const handleConnectLinkedIn = () => {
    if (!token) return;
    const state = btoa(token).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code`
      + `&client_id=${LI_CLIENT_ID}`
      + `&redirect_uri=${encodeURIComponent(LI_REDIRECT)}`
      + `&scope=${encodeURIComponent(LI_SCOPE)}`
      + `&state=${state}`;
    popupRef.current = window.open(url, "linkedin_oauth", "width=600,height=700,left=200,top=100");
  };

  const handlePublishToLinkedIn = async () => {
    if (!token) return;
    setPublishing(true);
    try {
      const { url } = await publishToLinkedIn(token, editedPost, visualImageData);
      setLinkedinPostUrl(url);
      // Auto-save to history on successful publish
      try {
        const latest = predictions[predictions.length - 1];
        await savePost(token, chosenTitle ?? "", editedPost, latest?.reactions ?? 0, latest?.comments ?? 0);
        setSaved(true);
        toast.success("Published to LinkedIn and saved to My Posts!");
      } catch {
        toast.success("Published to LinkedIn!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "LinkedIn publish failed.";
      if (msg.includes("not connected")) {
        clearLinkedIn();
        toast.error("LinkedIn session expired. Please reconnect.");
      } else {
        toast.error(msg);
      }
    } finally { setPublishing(false); }
  };

  // Sync LinkedIn connection status from backend on mount (avoids stale localStorage state)
  useEffect(() => {
    if (!token) return;
    checkLinkedInStatus(token)
      .then(({ connected, person_id }) => {
        if (connected) setLinkedIn(person_id);
        else clearLinkedIn();
      })
      .catch(() => { /* ignore — backend may be unreachable */ });
  }, [token, setLinkedIn, clearLinkedIn]);

  // Listen for OAuth popup result
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "linkedin_auth") return;
      if (e.data.success) {
        setLinkedIn(e.data.personId);
        toast.success("LinkedIn connected! You can now publish.");
      } else {
        toast.error(e.data.error ?? "LinkedIn connection failed.");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setLinkedIn]);

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

      {/* Engagement prediction */}
      <div className="flex items-center gap-4 bg-secondary/25 border border-border/40 rounded-xl px-5 py-3.5 mb-4">
        <p className="text-sm font-medium text-muted-foreground mr-auto">Predicted engagement</p>
        {predicting ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recalculating…
          </span>
        ) : predError ? (
          <span className="text-sm text-destructive">{predError}</span>
        ) : currentPrediction ? (
          <>
            <span className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              <Heart className="w-4 h-4 text-rose-500" />
              {currentPrediction.reactions}
              <span className="text-xs font-normal text-muted-foreground">likes</span>
            </span>
            <span className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              <MessageCircle className="w-4 h-4 text-primary" />
              {currentPrediction.comments}
              <span className="text-xs font-normal text-muted-foreground">comments</span>
            </span>
          </>
        ) : null}
      </div>

      {/* Edit toolbar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {isEditing ? (
          <>
            <ToolBtn onClick={() => { setEditedPost(draftText); setIsEditing(false); runPrediction(draftText); }} primary>
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
              <ToolBtn onClick={() => { const p = finalPost ?? ""; setEditedPost(p); setDraftText(p); runPrediction(p); }}>
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
        <Textarea
          value={refineInstruction}
          onChange={(e) => setRefineInstruction(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !refineLoading) handleRefine(); }}
          placeholder='"Make it more concise" or "Add a stronger hook"'
          className="min-h-[80px] resize-y bg-card border-border/60 focus-visible:ring-primary/40
            text-foreground placeholder:text-muted-foreground/45 text-sm mb-3"
          disabled={refineLoading}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground/50">Cmd/Ctrl + Enter to apply</p>
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
      <div className="flex flex-col gap-3 mb-10">
        {/* Row 1: primary actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={handleCopy}
            className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium text-white
              gradient-primary glow-primary hover:opacity-90 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>

          {/* LinkedIn publish flow */}
          {token && !linkedinConnected && (
            <button
              onClick={handleConnectLinkedIn}
              className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
                border border-[#0A66C2]/60 text-[#0A66C2] hover:bg-[#0A66C2]/10
                transition-all"
            >
              <Linkedin className="w-4 h-4" /> Connect LinkedIn
            </button>
          )}

          {token && linkedinConnected && !linkedinPostUrl && (
            <button
              onClick={handlePublishToLinkedIn}
              disabled={publishing}
              className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
                bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90
                disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
              {publishing ? "Publishing…" : "Publish to LinkedIn"}
            </button>
          )}

          {linkedinPostUrl && (
            <div className="flex items-center gap-2">
              <a
                href={linkedinPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
                  bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90 transition-all"
              >
                <ExternalLink className="w-4 h-4" /> View on LinkedIn
              </a>
              <button
                onClick={() => setLinkedinPostUrl(null)}
                title="Post again"
                className="p-3 rounded-lg border border-border/60 text-muted-foreground
                  hover:text-foreground hover:bg-white/5 transition-all"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Row 2: navigation */}
        <div className="flex gap-3 justify-center">
          <button onClick={() => setStep(4)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
              border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
              transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button onClick={reset}
            className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-medium
              border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5
              transition-all"
          >
            <RotateCw className="w-4 h-4" /> Start Over
          </button>
        </div>
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
          <div className="relative rounded-xl overflow-hidden border border-border/50 group">
            <img
              src={`data:${visualContentType};base64,${visualImageData}`}
              alt="Generated visual"
              className="w-full object-contain max-h-[480px]"
            />
            <button
              onClick={handleCopyImage}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100
                hover:bg-black/80 transition-all"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedImage ? "Copied!" : "Copy Image"}
            </button>
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
