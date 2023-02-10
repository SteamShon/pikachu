import { Dialog, DialogContent } from "@mui/material";
import type { Cube, Segment } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { cubeRouter } from "../../server/api/routers/cube";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCubeTree } from "../../utils/tree";
import type { SegmentWithCubeSchemaType } from "../schema/segment";
import SegmentForm from "./segmentForm";

function SegmentModal({
  cubes,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  cubes: Parameters<typeof SegmentForm>[0]["cubes"];
  initialData?: Parameters<typeof SegmentForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof cubeRouter>;
  type OutputType = RouterOutput["addSegment"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      const cubeConfig = prev.cubeConfigs[created.cubeConfigId];
      if (!cubeConfig) return prev;
      cubeConfig.cubes[created.id] = buildCubeTree(created);

      return prev;
    });

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
          cubes={cubes}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default SegmentModal;
