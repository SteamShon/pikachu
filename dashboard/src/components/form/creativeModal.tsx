import { Dialog, DialogContent } from "@mui/material";
import type { Content, ContentType } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { adGroupRouter } from "../../server/api/routers/adGroup";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildAdGroupTree } from "../../utils/tree";
import type { CreativeWithAdGroupIdAndContentIdType } from "../schema/creative";
import CreativeForm from "./creativeForm";

function CreativeModal({
  adGroups,
  contents,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  adGroups: ReturnType<typeof buildAdGroupTree>[];
  contents: (Content & { contentType: ContentType })[];
  initialData?: Parameters<typeof CreativeForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof adGroupRouter>;
  type OutputType = RouterOutput["addCreative"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const adGroups =
        prev.placementGroups[
          created?.campaign?.placement?.placementGroup?.id || ""
        ]?.placements[created?.campaign?.placement?.id || ""]?.campaigns[
          created?.campaign?.id || ""
        ]?.adGroups;
      if (!adGroups) return prev;
      adGroups[created.id] = buildAdGroupTree(created);

      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.adGroup.addCreative.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.adGroup.updateCreative.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });
  const onSubmit = (input: CreativeWithAdGroupIdAndContentIdType) => {
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
        <CreativeForm
          adGroups={adGroups}
          contents={contents}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreativeModal;