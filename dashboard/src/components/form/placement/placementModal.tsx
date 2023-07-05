import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { placementRouter } from "../../../server/api/routers/placement";
import { api } from "../../../utils/api";
import { buildPlacementTree } from "../../../utils/tree";
import type { toServiceTree } from "../../../utils/tree";
import type { PlacementSchemaType } from "../../schema/placement";
import PlacementForm from "./placementForm";

function PlacementModal({
  service,
  contentTypes,
  integrations,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof PlacementForm>[0]["service"];
  contentTypes: Parameters<typeof PlacementForm>[0]["contentTypes"];
  integrations: Parameters<typeof PlacementForm>[0]["integrations"];
  initialData?: Parameters<typeof PlacementForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof placementRouter>;
  type OutputType = RouterOutput["create"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      prev.placements[`${created.id}`] = buildPlacementTree(created);
      return prev;
    });
    setModalOpen(false);
  };

  const { mutate: create } = api.placement.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.placement.update.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: PlacementSchemaType) => {
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
        <PlacementForm
          service={service}
          contentTypes={contentTypes}
          integrations={integrations}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PlacementModal;
