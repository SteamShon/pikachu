import { zodResolver } from "@hookform/resolvers/zod";
import type { Service } from "@prisma/client";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { ServiceSchemaType } from "../../schema/service";
import { serviceSchema } from "../../schema/service";

import AWSS3ConfigForm from "./awsS3ConfigForm";
import BuilderIOConfigForm from "./builderIOConfigForm";

function ServiceForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (input: ServiceSchemaType) => void;
  initialData?: Service;
}) {
  const methods = useForm<ServiceSchemaType>({
    resolver: zodResolver(serviceSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="service-form">
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">Service</h1>

            <p className="mt-4 text-gray-500">enter</p>
          </div>
        </div>
        <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <label
            htmlFor="name"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <input
              id="name"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              defaultValue={initialData?.name}
              {...register("name")}
            />
            {errors.name && <p role="alert">{errors.name?.message}</p>}
            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              Name
            </span>
          </label>
          <label
            htmlFor="description"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <textarea
              id="description"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              defaultValue={initialData?.name}
              rows={5}
              {...register("description")}
            />
            {errors.description && (
              <p role="alert">{errors.description?.message}</p>
            )}
            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              Description
            </span>
          </label>
          <label
            htmlFor="status"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <select
              id="status"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register("status")}
              defaultValue={initialData?.status}
            >
              <option value="">Please select</option>
              <option value="CREATED">CREATED</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              Status
            </span>
          </label>
        </div>

        {/* <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">Configurations</h1>

            <p className="mt-4 text-gray-500">
              Give a correct configuration on this service
            </p>
          </div>
          <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
            <label
              htmlFor="s3Config"
              className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <AWSS3ConfigForm name="details.s3Config" />
            </label>
            <label
              htmlFor="s3Config"
              className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <BuilderIOConfigForm
                service={initialData}
                name="details.builderConfig"
              />
            </label>
          </div>
        </div> */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
            onClick={() => handleSubmit(onSubmit)}
          >
            Save
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

export default ServiceForm;
