import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Landing page after LinkedIn OAuth.
 * The backend (port 8000) handles the code exchange and redirects here with:
 *   ?success=true&person_id=...   on success
 *   ?error=...                    on failure
 * This page notifies the opener window via postMessage and closes itself.
 */
const OAuthCallback = () => {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const success  = params.get("success") === "true";
    const personId = params.get("person_id") ?? "";
    const error    = params.get("error") ?? "Unknown error";

    if (window.opener) {
      window.opener.postMessage(
        success
          ? { type: "linkedin_auth", success: true, personId }
          : { type: "linkedin_auth", success: false, error },
        "*",
      );
      window.close();
    } else {
      // Opened in main window (not popup) — just redirect home
      window.location.replace(success ? "/" : `/login`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Connecting LinkedIn…</span>
      </div>
    </div>
  );
};

export default OAuthCallback;
