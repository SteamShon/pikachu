import { Dialog, DialogContent } from "@mui/material";
import type { Content, ContentType, Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { adGroupRouter } from "../../server/api/routers/adGroup";
import type { cubeConfigRouter } from "../../server/api/routers/cubeConfig";
import type { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCubeConfigsTree } from "../../utils/tree";
import { buildAdGroupTree } from "../../utils/tree";
import type { CreativeWithAdGroupIdAndContentIdType } from "../schema/creative";
import type { CubeConfigWithServiceSchemaType } from "../schema/cubeConfig";
import CreativeForm from "./creativeForm";
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
  type RouterOutput = inferRouterOutputs<typeof cubeConfigRouter>;
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
