import type { Customset } from "@prisma/client";
import type { Dispatch, FC, SetStateAction } from "react";
// import { api } from "../../utils/api";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { customsetSchema } from "../schema/customset";
import { api } from "../../utils/api";
import ErrorSummary from "../common/error";
import CustomsetInfo from "./customsetInfo";

interface CustomsetModalProps {
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setCustomsets: Dispatch<SetStateAction<Customset[]>>;
}

function CustomsetModal({ setModalOpen, setCustomsets }: CustomsetModalProps) {
  const { mutate: addCustomset } = api.customset.create.useMutation({
    onSuccess(customset) {
      setCustomsets((prev) => [...prev, customset]);
    },
  });
  const methods = useForm<Customset>({
    // resolver: zodResolver(customsetSchema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;
  const onSubmit = (data: Customset) => console.error(data);

  return (
    // <div className="absolute inset-0 flex items-center justify-center bg-black/75">
    //   <div className="space-y-4 bg-white p-3">
    <div>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label>Name</label>
          <input
            {...register("name")}
            className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
          />
          <label>Description</label>
          <input
            {...register("description")}
            className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
          />
          <input {...register("ownerId", { value: "1" })} type="hidden" />
          <input {...register("creatorId", { value: "1" })} type="hidden" />
          <label>Info</label>
          <CustomsetInfo />
          <button type="submit">Submit</button>
          <ErrorSummary errors={errors} />
        </form>
      </FormProvider>
    </div>
    //   </div>
    // </div>
  );
}

export default CustomsetModal;
