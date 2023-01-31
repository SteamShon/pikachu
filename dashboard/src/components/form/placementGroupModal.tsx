import { Dialog, DialogContent } from "@mui/material";
import type { PlacementGroup, Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";
import { buildServiceTree } from "../../utils/tree";
import type { PlacementGroupWithServiceSchemaType } from "../schema/placementGroup";
import PlacementGroupForm from "./placementGroupForm";

function PlacementGroupModal({
  services,
  modalOpen,
  initialData,
  setModalOpen,
  setServiceTree,
}: {
  services: Service[];
  modalOpen: boolean;
  initialData?: PlacementGroup;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
  type OutputType = RouterOutput["addPlacementGroup"];

  const handleSuccess = (input: OutputType): void => {
    setServiceTree(buildServiceTree(input));
    setModalOpen(false);
  };

  const { mutate: create } = api.service.addPlacementGroup.useMutation({
    onSuccess(service) {
      handleSuccess(service);
    },
  });

  const { mutate: update } = api.service.updatePlacementGroup.useMutation({
    onSuccess(service) {
      handleSuccess(service);
    },
  });

  const onSubmit = (input: PlacementGroupWithServiceSchemaType) => {
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
        <PlacementGroupForm
          services={services}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PlacementGroupModal;
