import { useConfirm } from "material-ui-confirm";

export const useConfirmModal = () => {
  const confirm = useConfirm();
  return () =>
    confirm({
      description: "This action is permanent!",
      confirmationButtonProps: { color: "error", variant: "contained" },
      confirmationText: "Delete forever",
      cancellationText: "No thanks",
    });
};

// Milder variant for lower-stakes deletions - no "forever"/red-button treatment.
export const useConfirmModalSoft = () => {
  const confirm = useConfirm();
  return (description) =>
    confirm({
      description,
      confirmationButtonProps: { color: "primary", variant: "contained" },
      confirmationText: "Remove",
      cancellationText: "Cancel",
    });
};
