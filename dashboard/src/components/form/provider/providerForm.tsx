import { zodResolver } from "@hookform/resolvers/zod";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type { Provider, Service } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { jsonParseWithFallback } from "../../../utils/json";
import { PROVIDER_TEMPLATES } from "../../../utils/providerTemplate";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { ProviderSchemaType } from "../../schema/provider";
import { providerSchema } from "../../schema/provider";

function ProviderForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & {
    providers: Provider[];
  };
  initialData?: Provider;
  onSubmit: (input: ProviderSchemaType) => void;
}) {
  const [formSchema, setFormSchema] = useState<string | undefined>(undefined);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const methods = useForm<ProviderSchemaType>({
    resolver: zodResolver(providerSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    const details = initialData?.details as {
      [x: string]: unknown;
    };

    if (initialData) {
      console.log(initialData);
      reset({
        ...initialData,
        details,
      });
      // handleProviderChange(initialData.providerId);
      setFormSchema(details.schema as string);
      setFormValues(details.values as Record<string, unknown>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  const handleSchemaChange = (newSchema: string) => {
    setFormSchema(newSchema);
    setValue("details.schema", newSchema);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="integration-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Provider
            </h3>
            <input
              type="hidden"
              value={service.id}
              {...register("serviceId")}
            />
            <input
              type="hidden"
              value={formSchema}
              {...register("details.schema")}
            />
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Template</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("template")}
                    onChange={(e) => handleSchemaChange(e.target.value)}
                  >
                    <option value="">Please choose</option>
                    {PROVIDER_TEMPLATES.map(({ name, schema }) => {
                      return (
                        <option key={name} value={JSON.stringify(schema)}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
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
                    defaultValue={initialData?.status || "CREATED"}
                  >
                    <option value="">Please choose</option>
                    <option value="CREATED">CREATED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  {errors.status && (
                    <p role="alert">{errors.status?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Details</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <Controller
                    name="details.values"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <>
                        {formSchema && (
                          <JsonForms
                            schema={jsonParseWithFallback(formSchema)}
                            data={formValues}
                            renderers={materialRenderers}
                            cells={materialCells}
                            onChange={({ data }) => {
                              if (Object.keys(data).length === 0) return;

                              field.onChange(data);
                              setFormValues(data);
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                </dd>
              </div>
            </dl>
          </div>
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

export default ProviderForm;
