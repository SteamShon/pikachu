import { Dialog, DialogContent } from "@mui/material";
import type { Service } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
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
  initialData?: Service;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServices: Dispatch<SetStateAction<Service[]>>;
}) {
  const { mutate: create } = api.service.create.useMutation({
    onSuccess(service) {
      setServices((prev) => [...prev, service]);
      setModalOpen(false);
    },
  });

  const { mutate: update } = api.service.update.useMutation({
    onSuccess(service) {
      setServices((prev) => {
        return [
          ...prev.filter((service) => service.id !== service.id),
          service,
        ];
      });

      setModalOpen(false);
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
