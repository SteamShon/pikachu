import { Dialog, DialogContent } from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { placementRouter } from "../../server/api/routers/placement";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildIntegraionTree } from "../../utils/tree";
import type { IntegrationSchemaType } from "../schema/integration";
import IntegrationForm from "./integrationForm";
import axios from "axios";

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
  type RouterOutput = inferRouterOutputs<typeof placementRouter>;
  type OutputType = RouterOutput["addIntegration"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      const placement = prev.placements[created.id];
      if (!placement) return prev;

      placement.integrations = buildIntegraionTree(created.integrations);

      return prev;
    });
    setModalOpen(false);
  };

  const { mutate: create } = api.placement.addIntegration.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.placement.updateIntegration.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: IntegrationSchemaType) => {
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
