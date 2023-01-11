// import { api } from "../../utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Divider, TextField, Typography } from "@mui/material";
import type { Customset, CustomsetInfo, User } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import ErrorSummary from "../common/error";
import type { CustomsetSchemaType } from "../schema/customset";
import { customsetSchema } from "../schema/customset";
import CustomsetInfoForm from "./customsetInfoForm";
import { Button } from "@mui/material";

function CustomsetForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (input: CustomsetSchemaType) => void;
  initialData?: Customset & {
    customsetInfo: CustomsetInfo;
    createdBy: User;
  };
}) {
  const { data: session } = useSession();

  const methods = useForm<CustomsetSchemaType>({
    resolver: zodResolver(customsetSchema),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  if (!session) return <>Not Logged in</>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="customset-form">
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
        <Typography>Customset Info</Typography>
        <Divider light />
        <div className="pl-8">
          <CustomsetInfoForm />
        </div>
        <ErrorSummary errors={errors} />
        <div className="content-end">
          <button
            type="submit"
            className="rounded-md bg-violet-500 p-2 text-sm text-white transition hover:bg-violet-600"
          >
            Save
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

export default CustomsetForm;
