import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { providerRouter } from "../../../server/api/routers/provider";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import type { ProviderSchemaType } from "../../schema/provider";
import ProviderForm from "./providerForm";

function ProviderModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof ProviderForm>[0]["service"];
  initialData?: Parameters<typeof ProviderForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof providerRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      prev.providers[created.id] = created;
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.provider.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.provider.update.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const onSubmit = (input: ProviderSchemaType) => {
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
        <ProviderForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ProviderModal;
