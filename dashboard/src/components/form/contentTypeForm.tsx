import { zodResolver } from "@hookform/resolvers/zod";
import LoadingButton from "@mui/lab/LoadingButton";
import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type { Content, ContentType, Service } from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { jsonParseWithFallback } from "../../utils/json";
import { removeRenderFunction } from "../common/CodeTemplate";
import type { ContentTypeSchemaType } from "../schema/contentType";
import { contentTypeSchema } from "../schema/contentType";
import ContentTypeFormBuilder from "./contentTypeFormBuilder";
import ContentTypeRendererBuilder from "./contentTypeRendererBuilder";
import ContentTypeSchemaBuilder from "./contentTypeSchemaBuilder";

function ContentTypeForm({
  services,
  initialData,
  onSubmit,
}: {
  services: Service[];
  initialData?: ContentType & { contents: Content[] };
  onSubmit: (input: ContentTypeSchemaType & { serviceId: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [defaultValues, setDefaultValues] = useState<{ [x: string]: {} }>({});
  const [code, setCode] = useState<string | undefined>(undefined);
  const [activeStep, setActiveStep] = useState(0);

  const service = services.length === 1 ? services[0] : undefined;
  const methods = useForm<ContentTypeSchemaType & { serviceId: string }>({
    resolver: zodResolver(
      contentTypeSchema.extend({
        serviceId: z.string(),
      })
    ),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    const { serviceId, defaultValues, ...others } = initialData || {};

    const parsedDefaultValues = jsonParseWithFallback(defaultValues) as {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [x: string]: {};
    };
    setDefaultValues(parsedDefaultValues);
    setSchema(initialData?.schema || undefined);
    if (initialData?.uiSchema) {
      setCode(initialData?.uiSchema);
    } else {
      setCode(removeRenderFunction(undefined));
    }

    console.log(initialData);
    console.log(parsedDefaultValues);

    reset({
      ...others,
      serviceId: serviceId || undefined,
      defaultValues: parsedDefaultValues,
    });
  }, [initialData, reset]);

  const steps = [
    {
      label: "Schema",
      description: `build json schema for this contentType.`,
      component: (
        <ContentTypeSchemaBuilder
          initialData={initialData}
          schema={schema}
          setSchema={setSchema}
        />
      ),
    },
    {
      label: "Form",
      description: `provide default example values for this contentType.`,
      component: (
        <ContentTypeFormBuilder
          initialData={initialData}
          schema={schema}
          defaultValues={defaultValues}
          setDefaultValues={setDefaultValues}
        />
      ),
    },
    {
      label: "Preview",
      description: `provide renderer of this contentType and see preview.`,
      component: (
        <ContentTypeRendererBuilder
          initialData={initialData}
          defaultValues={defaultValues}
          code={code}
          setCode={setCode}
        />
      ),
    },
  ];

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
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("serviceId")}
                    defaultValue={initialData?.serviceId || service?.id || ""}
                  >
                    <option key="" value="" selected>
                      Select
                    </option>
                    {services.map((service) => {
                      return (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.name && <p role="alert">{errors.name?.message}</p>}
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
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stepper nonLinear activeStep={activeStep}>
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepButton
                      onClick={() => {
                        setActiveStep(index);
                      }}
                    >
                      {step.label}
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
            </Grid>
            <Grid item xs={12}>
              {steps[activeStep]?.component}
              {activeStep === steps.length - 1 ? (
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loadingPosition="end"
                    onClick={handleSubmit((input) => {
                      setLoading(true);
                      onSubmit(input);
                    })}
                    loading={loading}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <span>Save</span>
                  </LoadingButton>
                </div>
              ) : null}
            </Grid>
          </Grid>
        </div>
      </form>
    </FormProvider>
  );
}

export default ContentTypeForm;
