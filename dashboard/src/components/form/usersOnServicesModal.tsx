import { Dialog, DialogContent } from "@mui/material";
import type { Service, User, UsersOnServices } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { api } from "../../utils/api";

import type { UsersOnServicesSchemaType } from "../schema/usersOnServices";
import UsersOnServicesForm from "./usersOnServicesForm";

function UsersOnServicesModal({
  users,
  services,
  modalOpen,
  initialData,
  setModalOpen,
  setUsersOnServices,
}: {
  users: User[];
  services: Service[];
  modalOpen: boolean;
  initialData?: UsersOnServices;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setUsersOnServices: Dispatch<
    SetStateAction<(UsersOnServices & { user: User; service: Service })[]>
  >;
}) {
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
        <UsersOnServicesForm
          onSubmit={onSubmit}
          users={users}
          services={services}
        />
      </DialogContent>
    </Dialog>
  );
}

export default UsersOnServicesModal;
