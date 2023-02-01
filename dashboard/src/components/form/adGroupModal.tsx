import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import type { AdGroup } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { campaignRouter } from "../../server/api/routers/campaign";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCampaignTree } from "../../utils/tree";
import type { AdGroupWithCampaignSchemaType } from "../schema/adGroup";
import AdGroupForm from "./adGroupForm";

function AdGroupModal({
  campaigns,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  campaigns: ReturnType<typeof buildCampaignTree>[];
  initialData?: AdGroup;
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const [loading, setLoading] = useState(false);
  type RouterOutput = inferRouterOutputs<typeof campaignRouter>;
  type OutputType = RouterOutput["addAdGroup"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      const campaigns =
        prev.placementGroups[created?.placement?.placementGroup?.id || ""]
          ?.placements[created?.placement?.id || ""]?.campaigns;
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
        <AdGroupForm
          campaigns={campaigns}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AdGroupModal;
