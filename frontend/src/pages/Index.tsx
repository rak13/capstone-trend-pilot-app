import { useNavigate } from "react-router-dom";
import { useWizardStore } from "@/lib/wizard-store";
import { useAuthStore } from "@/lib/auth-store";
import ProgressStepper from "@/components/ProgressStepper";
import StepProfile from "@/components/steps/StepProfile";
import StepTopics from "@/components/steps/StepTopics";
import StepPostTitle from "@/components/steps/StepPostTitle";
import StepPosts from "@/components/steps/StepPosts";
import StepFinal from "@/components/steps/StepFinal";
import ThemeToggle from "@/components/ThemeToggle";
import { Rocket, History, LogOut } from "lucide-react";

const Index = () => {
  const { step, isLoading, reset: resetWizard } = useWizardStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); resetWizard(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="border-b border-border/50 sticky top-0 z-50"
        style={{ background: "rgba(27,27,27,0.85)", backdropFilter: "blur(16px)" }}
      >
        <div className="container max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-display font-semibold text-foreground tracking-tight">TrendPilot</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">LinkedIn Post Creator</span>
          </div>

          <div className="flex items-center gap-1">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:block mr-3">
                {user.name.split(" ")[0]}
              </span>
            )}
            <button
              onClick={() => navigate("/history")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                text-muted-foreground hover:text-foreground hover:bg-white/5
                transition-all duration-200"
            >
              <History className="w-4 h-4" />
              My Posts
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="w-9 h-9 rounded-lg flex items-center justify-center
                text-muted-foreground hover:text-foreground hover:bg-white/5
                transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-5xl mx-auto px-6 py-10">
        <ProgressStepper currentStep={step} />

        {isLoading ? (
          <div className="flex items-center justify-center py-28">
            <div className="text-center">
              <div className="w-9 h-9 border-2 border-primary/25 border-t-primary rounded-full animate-spin mx-auto mb-5" />
              <p className="text-base text-muted-foreground animate-pulse-soft">
                {step === 1 && "Finding trending topics for your ideas…"}
                {step === 2 && "Generating post titles…"}
                {step === 3 && "Creating post variants…"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {step === 1 && <StepProfile />}
            {step === 2 && <StepTopics />}
            {step === 3 && <StepPostTitle />}
            {step === 4 && <StepPosts />}
            {step === 5 && <StepFinal />}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
