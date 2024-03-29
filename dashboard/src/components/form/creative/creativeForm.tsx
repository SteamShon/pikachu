import { zodResolver } from "@hookform/resolvers/zod";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type {
  AdGroup,
  Campaign,
  Content,
  ContentType,
  Creative,
  Placement,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { extractSchema, toNewCreative } from "../../../utils/contentType";
import { jsonParseWithFallback } from "../../../utils/json";
import ContentPreview from "../../builder/contentPreview";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { CreativeWithAdGroupIdAndContentIdType } from "../../schema/creative";
import { creativeWithAdGroupIdAndContentId } from "../../schema/creative";

function CreativeForm({
  service,
  adGroups,
  contents,
  onSubmit,
  initialData,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
  adGroups: (AdGroup & { campaign: Campaign & { placement: Placement } })[];
  contents: (Content & {
    contentType: ContentType;
  })[];
  onSubmit: (input: CreativeWithAdGroupIdAndContentIdType) => void;
  initialData?: Creative & {
    adGroup: AdGroup & {
      campaign: Campaign & {
        placement: Placement;
      };
    };
  };
}) {
  const [adGroup, setAdGroup] = useState<typeof adGroups[0] | undefined>(
    undefined
  );
  const [content, setContent] = useState<typeof contents[0] | undefined>(
    undefined
  );
  const [validContents, setValidContents] = useState<typeof contents>([]);

  const methods = useForm<CreativeWithAdGroupIdAndContentIdType>({
    resolver: zodResolver(creativeWithAdGroupIdAndContentId),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    setAdGroup(initialData?.adGroup);
    setContent(
      contents.find((content) => content.id === initialData?.contentId)
    );
    reset({
      ...(initialData ? initialData : {}),
      adGroupId: initialData?.adGroup.id,
    });
  }, [reset, initialData, contents]);

  useEffect(() => {
    const valid = contents.filter(
      (c) => c.contentTypeId === adGroup?.campaign?.placement?.contentTypeId
    );

    setValidContents(valid);
  }, [adGroup, contents]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="campaign-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Creative
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">AdGroup</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("adGroupId")}
                    defaultValue={initialData?.adGroupId}
                    disabled={initialData ? true : false}
                    onChange={(e) => {
                      const adGroup = adGroups.find(
                        (ag) => ag.id === e.target.value
                      );
                      setAdGroup(adGroup);
                    }}
                  >
                    <option value="">Please choose</option>
                    {adGroups.map((adGroup) => {
                      return (
                        <option key={adGroup.id} value={adGroup.id}>
                          {adGroup.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.adGroupId && (
                    <p role="alert">{errors.adGroupId?.message}</p>
                  )}
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
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Content</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("contentId")}
                    value={content?.id}
                    onChange={(e) =>
                      setContent(
                        contents.find(
                          (content) => content.id === e.target.value
                        )
                      )
                    }
                  >
                    <option value="">Please choose</option>
                    {validContents.map((content) => {
                      return (
                        <option key={content.id} value={content.id}>
                          {content.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.contentId && (
                    <p role="alert">{errors.contentId?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Detail</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {content ? (
                    <JsonForms
                      schema={jsonParseWithFallback(
                        extractSchema(content?.contentType)
                      )}
                      //uischema={uiSchema}
                      data={jsonParseWithFallback(content?.values)}
                      renderers={materialRenderers}
                      cells={materialCells}
                      readonly={true}
                    />
                  ) : null}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Preview</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {content && (
                    <ContentPreview
                      service={service}
                      contentType={content.contentType}
                      creatives={[
                        initialData
                          ? {
                              id: initialData.id,
                              content: jsonParseWithFallback(content.values),
                            }
                          : toNewCreative(content.values),
                      ]}
                    />
                  )}
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

export default CreativeForm;
