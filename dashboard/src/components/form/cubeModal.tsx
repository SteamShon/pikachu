import { Dialog, DialogContent } from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceConfigRouter } from "../../server/api/routers/serviceConfig";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCubeConfigTree } from "../../utils/tree";
import type { CubeWithCubeConfigSchemaType } from "../schema/cube";
import CubeForm from "./cubeForm";

function CubeModal({
  cubeConfigs,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  cubeConfigs: CubeConfig[];
  initialData?: Parameters<typeof CubeForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceConfigRouter>;
  type OutputType = RouterOutput["addCube"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      prev.cubeConfigs[created.id] = buildCubeConfigTree(created);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.cubeConfig.addCube.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.cubeConfig.updateCube.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });
  const onSubmit = (input: CubeWithCubeConfigSchemaType) => {
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
          cubeConfigs={cubeConfigs}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CubeModal;
