import type { JSONObject, ModelType } from "@builder.io/admin-sdk";
import type {
  ContentType,
  ContentTypeInfo,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getModels } from "../../pages/api/builder.io/builderAdmin";
import { extractValue } from "../../utils/json";
import type { ContentTypeSchemaType } from "../schema/contentType";
import type { ContentTypeInfoSchemaType } from "../schema/contentTypeInfo";

function BuilderIOModelForm({
  service,
  contentType,
  name,
}: {
  name: string;
  contentType?: ContentType;
  service?: Service & { serviceConfig?: ServiceConfig | null };
}) {
  const [models, setModels] = useState<ModelType[]>([]);
  const [details, setDetails] = useState<string | undefined>(undefined);
  const { register, setValue } = useFormContext<ContentTypeSchemaType>();

  useEffect(() => {
    const builderPrivateKey = extractValue({
      object: service?.serviceConfig?.builderConfig,
      paths: ["privateKey"],
    }) as string | undefined;
    if (builderPrivateKey) {
      getModels({ builderPrivateKey }).then((models) => {
        setModels(models);
      });
    }
  }, [service]);

  const handleSelect = (modelId: string) => {
    const model = models.find((model) => model.id === modelId);
    console.log(model);
    setValue("id", model?.id || undefined);
    setValue("name", model?.name || "");
    setDetails(JSON.stringify(model ? (model as JSONObject) : {}));
  };
  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Buidler IO Models</h1>

          <p className="mt-4 text-gray-500">
            This is the registered models in builder.io.
          </p>
        </div>

        <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <input
            type="hidden"
            {...register("contentTypeInfo.contentTypeId")}
            value={contentType?.id}
          />
          <label
            htmlFor="model"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <select
              id="model"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              onChange={(e) => {
                handleSelect(e.target.value);
              }}
            >
              <option value="">Please select</option>
              {models.map((model) => (
                <option key={model.id} value={model.id || undefined}>
                  {model.name}
                </option>
              ))}
            </select>

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              BuilderIO Model
            </span>
          </label>
          <label
            htmlFor="details"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <textarea
              id="details"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              // {...register("contentTypeInfo.details")}
              value={details}
            />
            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              Details
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
export default BuilderIOModelForm;
