import { useState } from "react";

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

interface UseConfirmationReturn {
  confirmationModal: ConfirmationState;
  showConfirmation: (config: Omit<ConfirmationState, "isOpen">) => void;
  hideConfirmation: () => void;
}

const initialConfirmationState: ConfirmationState = {
  isOpen: false,
  title: "",
  description: "",
  onConfirm: () => {},
};

export function useConfirmation(): UseConfirmationReturn {
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationState>(
    initialConfirmationState
  );

  const showConfirmation = (config: Omit<ConfirmationState, "isOpen">) => {
    setConfirmationModal({
      ...config,
      isOpen: true,
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return {
    confirmationModal,
    showConfirmation,
    hideConfirmation,
  };
}
