import React from "react";
import { Box, Card, IconButton, Typography, alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import ResourceForm from "../forms/ResourceForm";
import { useResourcesQuery, useDeleteResourceMutation } from "../../queries/resources";

// A bare domain (e.g. "www.facebook.com") has no scheme, so as an <a href>
// it resolves relative to this app's own origin instead of leaving it.
const withScheme = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const Resources = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: resources = [] } = useResourcesQuery();
  const deleteResourceMutation = useDeleteResourceMutation();
  const confirm = useConfirmModal();

  const {
    formInitialData,
    editingId,
    formOpen,
    setFormOpen,
    onEditClick,
    onFormClose,
  } = useFormHelpers({
    name: "",
    url: "",
  });

  const onDeleteClick = async (id: string) => {
    try {
      await confirm();
    } catch {
      return;
    }

    deleteResourceMutation.mutate(id);
  };

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {t("pages.resources.intro")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          marginTop: 2,
          marginBottom: `${FAB_CONTENT_CLEARANCE}px`,
        }}
      >
        {resources.length === 0 && (
          <Typography color="text.secondary">{t("pages.resources.noneYet")}</Typography>
        )}

        {resources.map(({ name, url, _id }) => (
          <Card
            key={_id}
            component="a"
            href={withScheme(url)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              padding: theme.spacing(1, 2),
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
              backgroundColor: alpha(theme.palette.background.paper, 0.75),
              backdropFilter: "blur(6px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <OpenInNewIcon fontSize="small" color="action" />

              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap>{name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {url}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexShrink: 0 }}>
              <IconButton
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  onEditClick({ name, url }, _id);
                }}
              >
                <EditIcon />
              </IconButton>

              <IconButton
                color="error"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  onDeleteClick(_id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Card>
        ))}
      </Box>

      <AddFab onClick={() => setFormOpen(true)} />

      <ResourceForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default Resources;
