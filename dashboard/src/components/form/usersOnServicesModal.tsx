import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import type { Service, User, UsersOnServices } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { api } from "../../utils/api";

import type { UsersOnServicesSchemaType } from "../schema/usersOnServices";
import UsersOnServicesForm from "./usersOnServicesForm";

interface UsersOnServicesModalProps {
  modalOpen: boolean;
  initialData?: UsersOnServices;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setUsersOnServices: Dispatch<
    SetStateAction<(UsersOnServices & { user: User; service: Service })[]>
  >;
}

function UsersOnServicesModal({
  modalOpen,
  initialData,
  setModalOpen,
  setUsersOnServices,
}: UsersOnServicesModalProps) {
  const [loading, setLoading] = useState(false);
  const { mutate: create } = api.usersOnServices.create.useMutation({
    onSuccess(created) {
      setUsersOnServices(created.services);
      setModalOpen(false);
    },
  });

  const { mutate: update } = api.usersOnServices.update.useMutation({
    onSuccess(created) {
      setUsersOnServices(created.services);
      setModalOpen(false);
    },
  });

  const onSubmit = (input: UsersOnServicesSchemaType) => {
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
        <UsersOnServicesForm
          onSubmit={onSubmit}
          onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default UsersOnServicesModal;
