import type { Service, ServiceConfig } from "@prisma/client";
import { useFormContext } from "react-hook-form";
import type { ProviderSchemaType } from "../schema/provider";
import type ChannelForm from "./channelForm";
import Solapi from "./providers/solapi";
import { ChannelSchemaType } from "../schema/channel";

function ProviderForm({
  service,
  channel,
  type,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  channel: Parameters<typeof ChannelForm>[0]["initialData"];
  type: string;
}) {
  const methods = useFormContext<ChannelSchemaType>();
  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <>
      <input
        type="hidden"
        {...register("provider.channelId")}
        value={channel?.id}
      />
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Provider</h1>

          <p className="mt-4 text-gray-500">
            {/* Define schema, defaultValues, rendering code. */}
          </p>
        </div>
        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Name</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            <input
              className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
              {...register("provider.name")}
              defaultValue={channel?.provider?.name}
            />
            {errors.name && <p role="alert">{errors.name?.message}</p>}
          </dd>
        </div>
        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Description</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            <textarea
              className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
              rows={3}
              {...register("provider.description")}
              defaultValue={channel?.provider?.description || undefined}
            />
            {errors.description && (
              <p role="alert">{errors.description?.message}</p>
            )}
          </dd>
        </div>

        <Solapi channel={channel} />
      </div>
    </>
  );
}

export default ProviderForm;
