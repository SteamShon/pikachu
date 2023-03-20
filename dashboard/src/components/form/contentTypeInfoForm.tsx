import type {
  Content,
  ContentType,
  ContentTypeInfo,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useFormContext } from "react-hook-form";
import type { ContentTypeSchemaType } from "../schema/contentType";
import ContentTypeFormBuilder from "./contentTypeFormBuilder";
import ContentTypeSchemaBuilder from "./contentTypeSchemaBuilder";

function ContentTypeInfoForm({
  service,
  contentType,
  source,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  contentType?: ContentType & {
    contentTypeInfo?: ContentTypeInfo | null;
    contents: Content[];
  };
  source: string;
}) {
  console.log(contentType);
  const methods = useFormContext<ContentTypeSchemaType>();
  const { register } = methods;
  const detailsBuilder = () => {
    switch (source) {
      default:
        return (
          <>
            <ContentTypeSchemaBuilder contentType={contentType} />;
          </>
        );
    }
  };
  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">ContentType Info</h1>

          <p className="mt-4 text-gray-500">
            Define ContentType's schema, defaultValues, rendering code.
          </p>
        </div>
        <input
          type="hidden"
          {...register("contentTypeInfo.contentTypeId")}
          value={contentType?.id}
        />

        <div className="mx-auto mt-8 mb-0 space-y-4">
          <label
            htmlFor="details"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            {detailsBuilder()}
          </label>
        </div>
      </div>
    </>
  );
}

export default ContentTypeInfoForm;
