import { zodResolver } from "@hookform/resolvers/zod";
import type {
  AdSet,
  Content,
  ContentType,
  Integration,
  Placement,
  Provider,
  Segment,
  Service,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { parseJsonLogic } from "react-querybuilder";
import { toNewCreative } from "../../../utils/contentType";
import ContentPreview from "../../builder/contentPreview";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { AdSetSchemaType } from "../../schema/adSet";
import { adSetSchema } from "../../schema/adSet";
import SegmentQueryBuilder from "../segmentQueryBuilder";

function AdSetForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & {
    placements: (Placement & {
      integrations: (Integration & {
        provider: Provider | null;
        segments: Segment[];
      })[];
      adSets: (AdSet & { segment: Segment | null; content: Content })[];
    })[];
    contentTypes: (ContentType & {
      contents: Content[];
    })[];
    integrations: (Integration & { provider: Provider | null })[];
  };
  initialData?: AdSet;
  onSubmit: (input: AdSetSchemaType) => void;
}) {
  const [placement, setPlacement] = useState<
    typeof service.placements[0] | undefined
  >(undefined);
  const [contents, setContents] = useState<Content[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);

  const [segment, setSegment] = useState<Segment | undefined>(undefined);
  const [content, setContent] = useState<Content | undefined>(undefined);
  const [contentType, setContentType] = useState<
    typeof service.contentTypes[0] | undefined
  >(undefined);
  const [cubeIntegration, setCubeIntegration] = useState<
    typeof service.integrations[0] | undefined
  >(undefined);

  const methods = useForm<AdSetSchemaType>({
    resolver: zodResolver(adSetSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        contentId: initialData?.contentId,
      });

      const { contents, segments } = handlePlacementChange(
        initialData.placementId
      );
      handleContentChange(contents, initialData.contentId);
      handleSegmentChange(segments, initialData.segmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const placements = service.placements;

  const alreadySelectedContent = (
    content: Content,
    placement?: typeof service.placements[0]
  ) => {
    if (initialData) return false;
    if (!placement) return false;

    return (
      placement?.adSets.findIndex(
        (adSet) =>
          adSet.placementId === placement?.id && adSet.contentId === content.id
      ) >= 0
    );
  };

  const findPlacement = (placementId: string) => {
    return placements.find(({ id }) => id === placementId);
  };
  const handlePlacementChange = (placementId: string) => {
    const placement = findPlacement(placementId);
    setPlacement(placement);

    const contents = service.contentTypes
      .filter(({ id }) => id === placement?.contentTypeId)
      .flatMap(({ contents }) => contents)
      .filter((content) => !alreadySelectedContent(content, placement));
    setContents(contents);

    const segments = (placement?.integrations || []).flatMap(
      ({ segments }) => segments
    );
    setSegments(segments);

    return { placement, contents, segments };
  };
  const handleContentChange = (contents: Content[], contentId: string) => {
    const content = contents.find(({ id }) => id === contentId);
    setContent(content);
    const contentType = service.contentTypes.find(
      ({ id }) => id === content?.contentTypeId
    );
    setContentType(contentType);
  };
  const handleSegmentChange = (
    segments: Segment[],
    segmentId: string | null
  ) => {
    const segment = segments.find(({ id }) => id === segmentId);
    setSegment(segment);

    const cubeIntegration = service.integrations.find(
      ({ id }) => id === segment?.integrationId
    );
    setCubeIntegration(cubeIntegration);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="integration-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              AdSet
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Placement</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("placementId")}
                    onChange={(e) => handlePlacementChange(e.target.value)}
                    value={initialData?.placementId}
                  >
                    <option value="">Please choose</option>
                    {placements.map(({ id, name }) => {
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Content</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("contentId")}
                    onChange={(e) =>
                      handleContentChange(contents, e.target.value)
                    }
                  >
                    <option value="">Please choose</option>
                    {contents.map(({ id, name }) => {
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Content Preview
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <ContentPreview
                    service={service}
                    contentType={contentType}
                    creatives={[toNewCreative(content?.values)]}
                  />
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Segment</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("segmentId")}
                    onChange={(e) =>
                      handleSegmentChange(segments, e.target.value)
                    }
                  >
                    <option value="">Please choose</option>
                    {segments.map(({ id, name }) => {
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Segment Where
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {cubeIntegration && (
                    <SegmentQueryBuilder
                      providerDetails={cubeIntegration?.provider?.details}
                      integrationDetails={cubeIntegration?.details}
                      initialQuery={
                        segment?.where
                          ? parseJsonLogic(segment?.where)
                          : undefined
                      }
                      disabled={true}
                      onQueryChange={(newQuery) => {
                        console.log(newQuery);
                      }}
                      // onPopulationChange={(newPopulation) => {
                      //   console.log(newPopulation);
                      // }}
                    />
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
            </dl>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <CustomLoadingButton
            // disabled={checkValidate() && !checked}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      </form>
    </FormProvider>
  );
}

export default AdSetForm;
