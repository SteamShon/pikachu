import type { Service, ServiceConfig } from "@prisma/client";
import { useFormContext } from "react-hook-form";
import type { ServiceSchemaType } from "../schema/service";
import AWSS3ConfigForm from "./awsS3ConfigForm";

import BuilderIOConfigForm from "./builderIOConfigForm";

function ServiceConfigForm({
  service,
}: {
  service?: Service & { serviceConfig?: ServiceConfig };
}) {
  const methods = useFormContext<ServiceSchemaType>();
  const { register } = methods;

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Configurations</h1>

          <p className="mt-4 text-gray-500">
            Give a correct configuration on this service
          </p>
        </div>
        <input
          type="hidden"
          {...register("serviceConfig.serviceId")}
          value={service?.id}
        />

        <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <label
            htmlFor="s3Config"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <AWSS3ConfigForm service={service} name="serviceConfig.s3Config" />
          </label>
          <label
            htmlFor="s3Config"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <BuilderIOConfigForm
              service={service}
              name="serviceConfig.builderConfig"
            />
          </label>
        </div>
      </div>
    </>
  );
}

export default ServiceConfigForm;
