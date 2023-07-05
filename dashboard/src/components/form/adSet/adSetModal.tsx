import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import { useSnackbar } from "notistack";
import type { Dispatch, SetStateAction } from "react";
import type { adSetRouter } from "../../../server/api/routers/adSet";
import { api } from "../../../utils/api";
import type { fromServiceTree, toServiceTree } from "../../../utils/tree";
import type { AdSetSchemaType } from "../../schema/adSet";
import AdSetForm from "./adSetForm";

function AdSetModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: ReturnType<typeof fromServiceTree>;
  initialData?: Parameters<typeof AdSetForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const { enqueueSnackbar } = useSnackbar();
  type RouterOutput = inferRouterOutputs<typeof adSetRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const placement = prev.placements[created.placementId];
      if (!placement) return prev;
      placement.adSets[created.id] = created;
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.adSet.create.useMutation({
    onSuccess(created) {
      enqueueSnackbar(`success`, { variant: "success" });
      handleSuccess(created);
    },
    onError(error) {
      enqueueSnackbar(`failed to create: ${error}`, { variant: "error" });
    },
  });
  const { mutate: update } = api.adSet.update.useMutation({
    onSuccess(created) {
      enqueueSnackbar(`success`, { variant: "success" });
      handleSuccess(created);
    },
    onError(error) {
      enqueueSnackbar(`failed to update: ${error}`, { variant: "error" });
    },
  });
  const onSubmit = (input: AdSetSchemaType) => {
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
        <AdSetForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
export default AdSetModal;
