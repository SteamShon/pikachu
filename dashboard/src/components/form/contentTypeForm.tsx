import { zodResolver } from "@hookform/resolvers/zod";
import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type {
  Content,
  ContentType,
  ContentTypeInfo,
  Prisma,
  Service,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { jsonParseWithFallback } from "../../utils/json";
import { removeRenderFunction } from "../common/CodeTemplate";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { ContentTypeSchemaType } from "../schema/contentType";
import { contentTypeSchema } from "../schema/contentType";
import ContentTypeFormBuilder from "./contentTypeFormBuilder";
import ContentTypeRendererBuilder from "./contentTypeRendererBuilder";
import ContentTypeSchemaBuilder from "./contentTypeSchemaBuilder";

function ContentTypeForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service;
  initialData?: ContentType & {
    contentTypeInfo?: ContentTypeInfo;
    contents: Content[];
  };
  onSubmit: (input: ContentTypeSchemaType & { serviceId: string }) => void;
}) {
  const [source, setSource] = useState<string | undefined>(undefined);
  const [schema, setSchema] = useState<Prisma.JsonObject | undefined>(
    undefined
  );
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [defaultValues, setDefaultValues] = useState<
    Prisma.JsonObject | undefined
  >({});
  const [code, setCode] = useState<string | undefined>(undefined);
  const [activeStep, setActiveStep] = useState(0);

  const methods = useForm<ContentTypeSchemaType & { serviceId: string }>({
    resolver: zodResolver(contentTypeSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    const { serviceId, contentTypeInfo, source, ...others } = initialData || {};
    const details = contentTypeInfo?.details as Prisma.JsonObject | undefined;

    const defaultValueKey = source === "local" ? "defaultValues" : "";
    const defaultValues = details?.[defaultValueKey] as
      | Prisma.JsonObject
      | undefined;

    const schemaKey = source === "local" ? "schema" : "";
    const schemaValues = details?.[schemaKey] as Prisma.JsonObject | undefined;

    const uiSchemaKey = source === "local" ? "uiSchema" : "";
    const uiSchemaValues = details?.[uiSchemaKey] as
      | Prisma.JsonObject
      | undefined;

    console.log(details);
    console.log(defaultValues);
    console.log(schemaValues);
    console.log(uiSchemaValues);

    setDefaultValues(defaultValues);
    setSchema(schemaValues);
    if (uiSchemaValues) {
      setCode(JSON.stringify(uiSchemaValues));
    } else {
      setCode(removeRenderFunction(undefined));
    }
    setSource(initialData?.source);
    reset({
      ...others,
      serviceId: serviceId || undefined,
    });
  }, [initialData, reset]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="contentType-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Content Type
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <input
                  type="hidden"
                  {...register(`serviceId`)}
                  value={service.id}
                />
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
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("source")}
                    defaultValue={initialData?.source || "local"}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="local">LOCAL</option>
                    <option value="builder.io">BUILDER.IO</option>
                  </select>
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
            </dl>
          </div>
        </div>
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {source}
        </div>
      </form>
    </FormProvider>
  );
}

export default ContentTypeForm;
