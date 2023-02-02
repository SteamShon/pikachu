import { Dialog, DialogContent } from "@mui/material";
import type { ContentType } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { placementGroupRouter } from "../../server/api/routers/placementGroup";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildPlacementGroupTree } from "../../utils/tree";
import type { PlacementWithPlacementGroupSchemaType } from "../schema/placement";
import PlacementForm from "./placementForm";

function PlacementModal({
  placementGroups,
  contentTypes,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  placementGroups: ReturnType<typeof buildPlacementGroupTree>[];
  contentTypes: ContentType[];
  initialData?: Parameters<typeof PlacementForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof placementGroupRouter>;
  type OutputType = RouterOutput["addPlacement"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      prev.placementGroups[created.id] = buildPlacementGroupTree(created);
      return prev;
    });
    setModalOpen(false);
  };

  const { mutate: create } = api.placementGroup.addPlacement.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.placementGroup.updatePlacement.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: PlacementWithPlacementGroupSchemaType) => {
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
          placementGroups={placementGroups}
          contentTypes={contentTypes}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PlacementModal;
