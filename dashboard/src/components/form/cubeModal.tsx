import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { cubeRouter } from "../../server/api/routers/cube";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCubeTree } from "../../utils/tree";
import type { CubeSchemaType } from "../schema/cube";

import CubeForm from "./cubeForm";

function CubeModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof CubeForm>[0]["service"];
  initialData?: Parameters<typeof CubeForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof cubeRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    // setServiceTree((prev) => {
    //   if (!prev) return prev;
    //   if (!prev.serviceConfig?.cubes) return prev;

    //   prev.serviceConfig.cubes[created.id] = buildCubeTree(created);
    //   return prev;
    // });

    setModalOpen(false);
  };
  const { mutate: create } = api.cube.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.cube.update.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });
  const onSubmit = (input: CubeSchemaType) => {
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
        <CubeForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CubeModal;
