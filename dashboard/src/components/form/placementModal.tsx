import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import type { ContentType, Placement } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
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
  initialData?: Placement;
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    if (initialData) update(input);
    else create(input);

    setLoading(false);
  };

  return (
    <Dialog
      onClose={() => setModalOpen(false)}
      open={modalOpen}
      fullWidth
      maxWidth="lg"
    >
      <DialogContent>
        {loading ? <LinearProgress /> : null}
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
