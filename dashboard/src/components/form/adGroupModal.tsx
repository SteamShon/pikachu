import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { campaignRouter } from "../../server/api/routers/campaign";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCampaignTree } from "../../utils/tree";
import type { AdGroupWithCampaignSchemaType } from "../schema/adGroup";
import AdGroupForm from "./adGroupForm";

function AdGroupModal({
  campaigns,
  cubeIntegrations,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  campaigns: Parameters<typeof AdGroupForm>[0]["campaigns"];
  cubeIntegrations: Parameters<typeof AdGroupForm>[0]["cubeIntegrations"];
  initialData?: Parameters<typeof AdGroupForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof campaignRouter>;
  type OutputType = RouterOutput["addAdGroup"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      const campaigns = prev?.placements?.[created.placementId]?.campaigns;
      if (!campaigns) return prev;

      campaigns[created.id] = buildCampaignTree(created);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.campaign.addAdGroup.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });

  const { mutate: update } = api.campaign.updateAdGroup.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: AdGroupWithCampaignSchemaType) => {
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
        <AdGroupForm
          campaigns={campaigns}
          cubeIntegrations={cubeIntegrations}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AdGroupModal;
