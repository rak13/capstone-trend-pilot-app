import { Check } from "lucide-react";

const STEPS = ["About You", "Topics", "Post Title", "Posts", "Done"];

interface ProgressStepperProps {
  currentStep: number;
}

const ProgressStepper = ({ currentStep }: ProgressStepperProps) => {
  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    border transition-all duration-300
                    ${isCompleted
                      ? "gradient-primary text-white border-transparent glow-primary"
                      : isCurrent
                      ? "border-primary/60 text-primary bg-primary/10"
                      : "border-border/50 text-muted-foreground bg-secondary/40"
                    }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block transition-colors whitespace-nowrap
                    ${isCurrent ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/45"}`}
                >
                  {label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={`w-6 sm:w-10 lg:w-16 h-px mx-2 sm:mx-3 transition-colors duration-500
                    ${stepNum < currentStep ? "bg-primary/50" : "bg-border/40"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
