import type { Dispatch, SetStateAction } from "react";
// import { api } from "../../utils/api";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import type { Customset, CustomsetInfo } from "@prisma/client";
import { useSession } from "next-auth/react";
import CustomsetForm from "./customsetForm";
import { api } from "../../utils/api";
import type { CustomsetSchemaType } from "../schema/customset";

interface CustomsetModalProps {
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setCustomsets: Dispatch<
    SetStateAction<
      (Customset & {
        customsetInfo: CustomsetInfo | null;
        createdBy: User;
      })[]
    >
  >;
}

function CustomsetModal({
  modalOpen,
  setModalOpen,
  setCustomsets,
}: CustomsetModalProps) {
  const { data: session } = useSession();
  const { mutate: addCustomset } = api.customset.create.useMutation({
    onSuccess(customset) {
      if (customset) {
        setCustomsets((prev) => [...prev, customset]);
      }
      setModalOpen(false);
    },
  });

  const onSubmit = (input: CustomsetSchemaType) => {
    console.log(input);

    if (!session?.user) {
      return;
    }

    addCustomset(input);
  };

  if (!session) return <>Not Logged in</>;

  return (
    <Dialog onClose={() => setModalOpen(false)} open={modalOpen}>
      <DialogTitle>Customset</DialogTitle>
      <DialogContent>
        <CustomsetForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

export default CustomsetModal;
