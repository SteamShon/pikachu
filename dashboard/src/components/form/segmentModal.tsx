import { Dialog, DialogContent } from "@mui/material";
import type { Segment } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { cubeRouter } from "../../server/api/routers/cube";
import { api } from "../../utils/api";
import type { SegmentWithCubeSchemaType } from "../schema/segment";
import SegmentForm from "./segmentForm";

function SegmentModal({
  cube,
  initialData,
  modalOpen,
  setModalOpen,
  setSegments,
}: {
  cube: Parameters<typeof SegmentForm>[0]["cube"];
  initialData?: Parameters<typeof SegmentForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setSegments: Dispatch<SetStateAction<Segment[]>>;
}) {
  type RouterOutput = inferRouterOutputs<typeof cubeRouter>;
  type OutputType = RouterOutput["addSegment"];

  const handleSuccess = (created: OutputType): void => {
    setSegments(created.segments);
    setModalOpen(false);
  };

  const { mutate: create } = api.cube.addSegment.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.cube.updateSegment.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: SegmentWithCubeSchemaType) => {
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
          cubes={[cube]}
          cube={cube}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default SegmentModal;
