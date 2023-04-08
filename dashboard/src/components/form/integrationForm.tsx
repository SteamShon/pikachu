import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ContentType,
  Cube,
  Integration,
  IntegrationInfo,
  Placement,
  Service,
} from "@prisma/client";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { PlacementSchemaType } from "../schema/placement";
import { placementSchema } from "../schema/placement";

function IntegrationForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service;
  initialData?: Integration & { integrationInfo: IntegrationInfo | null };
  onSubmit: (input: PlacementSchemaType) => void;
}) {
  const methods = useForm<PlacementSchemaType>({
    resolver: zodResolver(placementSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="placement-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Integration
            </h3>
          </div>
          <div className="border-t border-gray-200"></div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <CustomLoadingButton
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      </form>
    </FormProvider>
  );
}

export default IntegrationForm;
