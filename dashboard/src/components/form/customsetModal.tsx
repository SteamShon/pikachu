import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import type { Customset, CustomsetInfo, Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildCustomsetsTree } from "../../utils/tree";
import type { CustomsetWithServiceSchemaType } from "../schema/customset";
import CustomsetForm from "./customsetForm";

function CustomsetModal({
  services,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  services: Service[];
  initialData?: Customset & { customsetInfo: CustomsetInfo };
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const [loading, setLoading] = useState(false);
  type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
  type OutputType = RouterOutput["addCustomset"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return undefined;

      prev.customsets = buildCustomsetsTree(created.customsets);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.service.addCustomset.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.service.updateCustomset.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: CustomsetWithServiceSchemaType) => {
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
