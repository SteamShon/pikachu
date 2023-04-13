import type {
  Integration,
  IntegrationInfo,
  Placement,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useFormContext } from "react-hook-form";
import type { IntegrationSchemaType } from "../schema/integration";
import IntegrationInfoBuilder from "./integrationInfoBuilder";

function IntegrationInfoForm({
  service,
  integration,
  type,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  integration?: Integration & {
    placement: Placement;
    integrationInfo: IntegrationInfo | null;
  };
  type: string;
}) {
  const methods = useFormContext<IntegrationSchemaType>();
  const { register } = methods;

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Integration Info</h1>

          <p className="mt-4 text-gray-500">
            {/* Define schema, defaultValues, rendering code. */}
          </p>
        </div>
        <input
          type="hidden"
          {...register("integrationInfo.integrationId")}
          value={integration?.id}
        />

        <div className="mx-auto mt-8 mb-0 space-y-4">
          <label
            htmlFor="details"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <IntegrationInfoBuilder integration={integration} />
          </label>
        </div>
      </div>
    </>
  );
}

export default IntegrationInfoForm;
