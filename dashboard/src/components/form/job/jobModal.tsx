import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import { useSnackbar } from "notistack";
import type { Dispatch, SetStateAction } from "react";
import type { jobRouter } from "../../../server/api/routers/job";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import type { JobSchemaType } from "../../schema/job";
import JobForm from "./jobForm";

function JobModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof JobForm>[0]["service"];
  initialData?: Parameters<typeof JobForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const { enqueueSnackbar } = useSnackbar();
  type RouterOutput = inferRouterOutputs<typeof jobRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const integrations = prev.integrations[created.integrationId];

      if (!integrations) return prev;
      integrations.jobs[created.id] = created;
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.job.create.useMutation({
    onSuccess(created) {
      enqueueSnackbar(`success`, { variant: "success" });
      handleSuccess(created);
    },
    onError(error) {
      enqueueSnackbar(`failed to create: ${error}`, { variant: "error" });
    },
  });
  const { mutate: update } = api.job.update.useMutation({
    onSuccess(created) {
      enqueueSnackbar(`success`, { variant: "success" });
      handleSuccess(created);
    },
    onError(error) {
      enqueueSnackbar(`failed to update: ${error}`, { variant: "error" });
    },
  });
  const onSubmit = (input: JobSchemaType) => {
    if (initialData) update(input);
    else create(input);
  };

  return (
    <Dialog
      onClose={() => setModalOpen(false)}
      open={modalOpen}
      fullWidth
      maxWidth="lg"
    >
      <DialogContent>
        <JobForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
export default JobModal;
