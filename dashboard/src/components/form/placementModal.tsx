import { Dialog, DialogContent } from "@mui/material";
import type { ContentType, Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";
import { buildServiceTree } from "../../utils/tree";
import type { PlacementSchemaType } from "../schema/placement";
import PlacementForm from "./placementForm";

function PlacementModal({
  service,
  contentTypes,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Service;
  contentTypes: ContentType[];
  initialData?: Parameters<typeof PlacementForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
  type OutputType = RouterOutput["addPlacement"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;
      return buildServiceTree(created);
    });
    setModalOpen(false);
  };

  const { mutate: create } = api.service.addPlacement.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.service.updatePlacement.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: PlacementSchemaType) => {
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
        <PlacementForm
          service={service}
          contentTypes={contentTypes}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PlacementModal;
