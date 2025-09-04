// Updated 2024-12-19: Created modular ProgressIndicator component for onboarding flow

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  stepLabel 
}: ProgressIndicatorProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full ${
              index < currentStep
                ? "bg-violet-600"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
      {stepLabel && (
        <p className="mt-2 text-sm text-muted-foreground">{stepLabel}</p>
      )}
    </div>
  );
}
