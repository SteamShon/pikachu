import { Dialog, DialogContent } from "@mui/material";
import type { Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceRouter } from "../../../server/api/routers/service";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import { buildCustomsetsTree } from "../../../utils/tree";
import type { CustomsetWithServiceSchemaType } from "../../schema/customset";
import CustomsetForm from "./customsetForm";
import { customsetRouter } from "../../../server/api/routers/customset";

function CustomsetModal({
  services,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  services: Service[];
  initialData?: Parameters<typeof CustomsetForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof customsetRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return undefined;

      prev.customsets = buildCustomsetsTree(created.customsets);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.customset.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.customset.update.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: CustomsetWithServiceSchemaType) => {
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
        <CustomsetForm
          services={services}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CustomsetModal;
