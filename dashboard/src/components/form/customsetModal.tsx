import type { Dispatch, FC, SetStateAction } from "react";
// import { api } from "../../utils/api";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { customsetSchema } from "../schema/customset";
import { api } from "../../utils/api";
import ErrorSummary from "../common/error";
import type { Customset, CustomsetInfo } from "@prisma/client";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  TextField,
  Typography,
} from "@mui/material";
import CustomsetInfoForm from "./customsetInfoForm";
import { useSession } from "next-auth/react";

interface CustomsetModalProps {
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setCustomsets: Dispatch<
    SetStateAction<
      (Customset & {
        customsetInfo: CustomsetInfo | null;
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
      setCustomsets((prev) => [...prev, customset]);
      setModalOpen(false);
    },
  });
  const methods = useForm({
    resolver: zodResolver(customsetSchema),
  });
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = methods;
  const onSubmit = (data: any) => {
    console.log(data);
    if (!session?.user) {
      console.log("not logged in.");
      return;
    }
    const params = {
      name: data.name,
      description: data.description || undefined,
      ownerId: data.ownerId,
      creatorId: data.creatorId,
      status: data.status || undefined,
      info: data.info,
    };
    console.log(params);
    addCustomset(params);
  };

  if (!session) return <>Not Logged in</>;

  return (
    <Dialog onClose={() => setModalOpen(false)} open={modalOpen}>
      <DialogTitle>New Customset</DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <form>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth />
              )}
            />
            <input
              type="hidden"
              {...register("creatorId", { value: session?.user?.id })}
            />
            <Typography>Customset Info</Typography>
            <div className="pl-8">
              <CustomsetInfoForm />
            </div>

            <ErrorSummary errors={errors} />
          </form>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModalOpen(false)}>Close</Button>
        <Button onClick={handleSubmit(onSubmit)}>Save</Button>
      </DialogActions>
    </Dialog>

    // <div className="absolute inset-0 flex items-center justify-center bg-black/75">
    //   <div className="space-y-4 bg-white p-3">
    //     <FormProvider {...methods}>
    //       <form onSubmit={handleSubmit(onSubmit)}>
    //         <label>Name</label>
    //         <input
    //           {...register("name")}
    //           className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
    //         />
    //         <label>Description</label>
    //         <input
    //           {...register("description")}
    //           className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
    //         />
    //         <input {...register("ownerId", { value: "1" })} type="hidden" />
    //         <input {...register("creatorId", { value: "1" })} type="hidden" />
    //         <label>Info</label>
    //         <CustomsetInfo />
    //         <button type="submit">Submit</button>
    //         <ErrorSummary errors={errors} />
    //       </form>
    //     </FormProvider>
    //   </div>
    // </div>
  );
}

export default CustomsetModal;
