import { useNavigate } from "react-router-dom";
import { useWizardStore } from "@/lib/wizard-store";
import { useAuthStore } from "@/lib/auth-store";
import ProgressStepper from "@/components/ProgressStepper";
import StepProfile from "@/components/steps/StepProfile";
import StepTopics from "@/components/steps/StepTopics";
import StepPostTitle from "@/components/steps/StepPostTitle";
import StepPosts from "@/components/steps/StepPosts";
import StepFinal from "@/components/steps/StepFinal";
import { Rocket, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { step, isLoading } = useWizardStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">TrendPilot</h1>
              <p className="text-xs text-muted-foreground">LinkedIn Post Creator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:block mr-2">
                Hi, {user.name.split(" ")[0]}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
              <History className="w-4 h-4 mr-1" />
              My Posts
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <ProgressStepper currentStep={step} />

        {/* Loading overlay */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-medium animate-pulse-soft">
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
