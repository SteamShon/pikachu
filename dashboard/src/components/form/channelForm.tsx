import { zodResolver } from "@hookform/resolvers/zod";
import type { Channel, Placement, Provider, Service } from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { ChannelSchemaType } from "../schema/channel";
import { channelSchema } from "../schema/channel";
import ProviderForm from "./providerForm";

function ChannelForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & { placements: Placement[] };
  initialData?: Channel & {
    provider: Provider | null;
  };
  onSubmit: (input: ChannelSchemaType) => void;
}) {
  const [type, setType] = useState<string | undefined>(undefined);

  const methods = useForm<ChannelSchemaType>({
    resolver: zodResolver(channelSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = methods;

  console.log(errors);

  useEffect(() => {
    const details = initialData?.provider?.details as {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [x: string]: {};
    };
    if (initialData) {
      reset({
        ...initialData,
        provider: {
          ...initialData.provider,
          channelId: initialData?.id,
          details,
        },
      });
    }
  }, [initialData, reset]);

  const checkIntegration = async () => {
    const config = watch("provider.details");
    console.log(config);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="channel-form">
        <input type="hidden" {...register("serviceId")} value={service.id} />

        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Channel
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.name}
                    {...register("name")}
                  />
                  {errors.name && <p role="alert">{errors.name?.message}</p>}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.description || undefined}
                    rows={3}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p role="alert">{errors.description?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("status")}
                    defaultValue={initialData?.status}
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  {errors.status && (
                    <p role="alert">{errors.status?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("type")}
                    defaultValue={initialData?.type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Please select</option>
                    <option value="DISPLAY">DISPLAY</option>
                    <option value="INAPP_PUSH">INAPP PUSH</option>
                    <option value="SMS">SMS</option>
                  </select>
                  {errors.type && <p role="alert">{errors.type?.message}</p>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {initialData ? (
            <ProviderForm
              service={service}
              channel={initialData}
              type={type || "DISPLAY"}
            />
          ) : null}
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          {/* {initialData === undefined && (
            <CustomLoadingButton
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
            />
          )}
          {initialData && (
            <button
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              type="button"
              onClick={() => checkIntegration()}
            >
              Validate
            </button>
          )} */}
          <CustomLoadingButton
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      </form>
    </FormProvider>
  );
}

export default ChannelForm;
