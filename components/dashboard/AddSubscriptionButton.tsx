// Updated 2024-12-19: Created AddSubscriptionButton component as modal trigger

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddSubscriptionModal } from "./AddSubscriptionModal";

interface AddSubscriptionButtonProps {
  onSuccess?: () => void;
  userTier?: string;
  userCurrency?: string;
  userTaxRate?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function AddSubscriptionButton({
  onSuccess,
  userTier = 'free',
  userCurrency = 'USD',
  userTaxRate = 30.0,
  variant = "default",
  size = "default",
  className,
  children,
}: AddSubscriptionButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowModal(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {children || "Add Subscription"}
      </Button>

      <AddSubscriptionModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={() => {
          setShowModal(false);
          if (onSuccess) onSuccess();
        }}
        userTier={userTier}
        userCurrency={userCurrency}
        userTaxRate={userTaxRate}
      />
    </>
  );
}
