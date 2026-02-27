import { Check, Rocket } from "lucide-react";

const STEPS = ["About You", "Topics", "Post Title", "Posts", "Done"];

interface ProgressStepperProps {
  currentStep: number;
}

const ProgressStepper = ({ currentStep }: ProgressStepperProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${isCompleted ? "gradient-primary text-primary-foreground" : ""}
                    ${isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : ""}
                    ${!isCompleted && !isCurrent ? "bg-secondary text-muted-foreground" : ""}
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block
                    ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 lg:w-24 h-0.5 mx-1 sm:mx-2 transition-colors duration-300
                    ${stepNum < currentStep ? "bg-primary" : "bg-border"}
                  `}
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
