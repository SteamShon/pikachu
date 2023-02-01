import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import type { Campaign } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { placementRouter } from "../../server/api/routers/placement";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildPlacementTree } from "../../utils/tree";
import type { CampaignWithPlacementSchemaType } from "../schema/campaign";
import CampaignForm from "./campaignForm";

function CampaignModal({
  placements,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  placements: ReturnType<typeof buildPlacementTree>[];
  initialData?: Campaign;
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const [loading, setLoading] = useState(false);
  type RouterOutput = inferRouterOutputs<typeof placementRouter>;
  type OutputType = RouterOutput["addCampaign"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const placements =
        prev.placementGroups[created?.placementGroup?.id || ""]?.placements;
      if (!placements) return prev;
      placements[created.id] = buildPlacementTree(created);

      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.placement.addCampaign.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });

  const { mutate: update } = api.placement.updateCampaign.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: CampaignWithPlacementSchemaType) => {
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
        <CampaignForm
          placements={placements}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CampaignModal;
