import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Content,
  ContentType,
  ContentTypeInfo,
  Prisma,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { removeRenderFunction } from "../common/CodeTemplate";
import type { ContentTypeSchemaType } from "../schema/contentType";
import { contentTypeSchema } from "../schema/contentType";
import type { ContentTypeInfoSchemaType } from "../schema/contentTypeInfo";
import { contentTypeInfoSchema } from "../schema/contentTypeInfo";
import BuilderIOModelForm from "./builderIOModelForm";

function ContentTypeInfoDetailForm({
  service,
  contentType,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  contentType?: ContentType & {
    contentTypeInfo?: ContentTypeInfo | null;
    contents: Content[];
  };
}) {
  const methods = useFormContext<ContentTypeSchemaType>();
  const { register } = methods;

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Details</h1>

          <p className="mt-4 text-gray-500">enter</p>
        </div>

        <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <label
            htmlFor="details"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          ></label>
        </div>
      </div>
    </>
  );
}

export default ContentTypeInfoDetailForm;
