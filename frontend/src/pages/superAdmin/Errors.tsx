import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useAppErrorsQuery, useClearAppErrorsMutation } from "../../queries/appErrors";
import { formatDate } from "../../helpers/dateHelpers";

const preSx = {
  margin: 0,
  padding: 1,
  borderRadius: 1,
  backgroundColor: "action.hover",
  fontSize: 12,
  whiteSpace: "pre-wrap",
  overflowX: "auto",
} as const;

const Errors = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const navigate = useNavigate();
  const confirm = useConfirmModal();
  const { data: errors = [] } = useAppErrorsQuery();
  const clearMutation = useClearAppErrorsMutation();

  useEffect(() => {
    if (!user || !isSuperAdmin) navigate({ to: "/login" });
  }, [user, isSuperAdmin, navigate]);

  if (!user || !isSuperAdmin) return null;

  const onClearClick = async () => {
    try {
      await confirm();
    } catch {
      return;
    }

    clearMutation.mutate();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4">{t("pages.appErrors.title")}</Typography>

        {errors.length > 0 && (
          <Button color="error" onClick={onClearClick} loading={clearMutation.isPending}>
            {t("pages.appErrors.clearAll")}
          </Button>
        )}
      </Stack>

      {errors.length === 0 ? (
        <Typography color="text.secondary">{t("pages.appErrors.empty")}</Typography>
      ) : (
        errors.map((error) => (
          <Accordion key={error._id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack sx={{ gap: 0.5, width: "100%" }}>
                <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  {error.statusCode && <Chip size="small" color="error" label={error.statusCode} />}
                  {error.method && error.route && (
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {error.method} {error.route}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(error.createdAt, "dd/MM/yyyy HH:mm:ss")}
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  {error.message}
                </Typography>
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Stack sx={{ gap: 1.5 }}>
                {(error.club || error.userId) && (
                  <Typography variant="caption" color="text.secondary">
                    {error.club && `${t("pages.appErrors.club")}: ${error.club}`}
                    {error.club && error.userId && " · "}
                    {error.userId && `${t("pages.appErrors.userId")}: ${error.userId}`}
                  </Typography>
                )}

                {error.context !== undefined && error.context !== null && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("pages.appErrors.context")}
                    </Typography>
                    <Box component="pre" sx={preSx}>
                      {JSON.stringify(error.context, null, 2)}
                    </Box>
                  </Box>
                )}

                {error.stack && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("pages.appErrors.stack")}
                    </Typography>
                    <Box component="pre" sx={preSx}>
                      {error.stack}
                    </Box>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default Errors;
