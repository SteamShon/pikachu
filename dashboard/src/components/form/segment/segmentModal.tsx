import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { segmentRouter } from "../../../server/api/routers/segment";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import type { SegmentSchemaType } from "../../schema/segment";
import SegmentForm from "./segmentForm";

function SegmentModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof SegmentForm>[0]["service"];
  initialData?: Parameters<typeof SegmentForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof segmentRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const integration = prev.integrations[created.integrationId];

      if (!integration) return prev;
      integration.segments[created.id] = created;
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.segment.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.segment.update.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const onSubmit = (input: SegmentSchemaType) => {
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
        <SegmentForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default SegmentModal;
