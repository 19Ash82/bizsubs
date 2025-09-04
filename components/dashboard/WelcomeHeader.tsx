// Updated 2024-12-19: Created modular WelcomeHeader component for dashboard

interface WelcomeHeaderProps {
  firstName?: string;
}

export function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-2">
        Welcome to BizSubs{firstName ? `, ${firstName}` : ""}! 🎉
      </h1>
      <p className="text-muted-foreground">
        Your business subscription tracker is ready to help you organize and manage your expenses.
      </p>
    </div>
  );
}
