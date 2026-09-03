import { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";

export const useConfirmModal = () => {
  const confirm = useConfirm();
  const { t } = useTranslation();

  return () =>
    confirm({
      description: t("confirm.permanentWarning"),
      confirmationButtonProps: { color: "error", variant: "contained" },
      confirmationText: t("confirm.deleteForever"),
      cancellationText: t("confirm.noThanks"),
    });
};

// Milder variant for lower-stakes deletions - no "forever"/red-button treatment.
export const useConfirmModalSoft = () => {
  const confirm = useConfirm();
  const { t } = useTranslation();

  return (description) =>
    confirm({
      description,
      confirmationButtonProps: { color: "primary", variant: "contained" },
      confirmationText: t("confirm.remove"),
      cancellationText: t("common.cancel"),
    });
};
