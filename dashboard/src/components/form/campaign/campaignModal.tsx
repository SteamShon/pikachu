import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { placementRouter } from "../../../server/api/routers/placement";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import { buildPlacementTree } from "../../../utils/tree";
import type { CampaignWithPlacementSchemaType } from "../../schema/campaign";
import CampaignForm from "./campaignForm";

function CampaignModal({
  placements,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  placements: ReturnType<typeof buildPlacementTree>[];
  initialData?: Parameters<typeof CampaignForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof placementRouter>;
  type OutputType = RouterOutput["addCampaign"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const placements = prev?.placements;
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
