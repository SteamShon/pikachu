import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { integrationRouter } from "../../server/api/routers/integration";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import type { IntegrationSchemaType } from "../schema/integration";
import IntegrationForm from "./integrationForm";

function IntegrationModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  initialData?: Parameters<typeof IntegrationForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof integrationRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      prev.integrations[created.id] = created;
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.integration.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.integration.update.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const onSubmit = (input: IntegrationSchemaType) => {
    console.log(input);

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
        <IntegrationForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default IntegrationModal;
