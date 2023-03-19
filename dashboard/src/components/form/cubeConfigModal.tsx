import { Dialog, DialogContent } from "@mui/material";
import type { Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceConfigRouter } from "../../server/api/routers/serviceConfig";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCubeConfigsTree } from "../../utils/tree";
import type { CubeConfigWithServiceSchemaType } from "../schema/serviceConfig";
import CubeConfigForm from "./cubeConfigForm";

function CubeConfigModal({
  services,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  services: Service[];
  initialData?: Parameters<typeof CubeConfigForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceConfigRouter>;
  type OutputType = RouterOutput["addCubeConfig"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      prev.cubeConfigs = buildCubeConfigsTree(created.cubeConfigs);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.cubeConfig.addCubeConfig.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.cubeConfig.updateCubeConfig.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });
  const onSubmit = (input: CubeConfigWithServiceSchemaType) => {
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
        <CubeConfigForm
          services={services}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CubeConfigModal;
