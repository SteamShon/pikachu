import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import type { Service } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
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
