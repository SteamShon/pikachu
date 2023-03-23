import { Dialog, DialogContent } from "@mui/material";
import type { Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";
import type { ServiceSchemaType } from "../schema/service";
import ServiceForm from "./serviceForm";

function ServiceModal({
  modalOpen,
  initialData,
  setModalOpen,
  setServices,
}: {
  modalOpen: boolean;
  initialData?: Parameters<typeof ServiceForm>[0]["initialData"];
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServices: Dispatch<SetStateAction<Service[]>>;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServices((prev) => {
      return [...prev.filter((service) => service.id !== service.id), created];
    });

    setModalOpen(false);
  };

  const { mutate: create } = api.service.create.useMutation({
    onSuccess(service) {
      handleSuccess(service);
    },
  });

  const { mutate: update } = api.service.update.useMutation({
    onSuccess(service) {
      handleSuccess(service);
    },
  });

  const onSubmit = (input: ServiceSchemaType) => {
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
        <ServiceForm
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ServiceModal;
