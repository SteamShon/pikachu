// import { api } from "../../utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  AdGroup,
  Campaign,
  Integration,
  Placement,
  Provider,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { formatQuery, parseJsonLogic } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.scss";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { AdGroupWithCampaignSchemaType } from "../../schema/adGroup";
import { adGroupWithCampaignSchema } from "../../schema/adGroup";
import SegmentQueryBuilder from "../segmentQueryBuilder";

function AdGroupForm({
  campaigns,
  providers,
  cubeIntegrations,
  onSubmit,
  initialData,
}: {
  campaigns: (Campaign & {
    placement: Placement & {
      integrations: Integration[];
    };
  })[];
  providers: Provider[];
  cubeIntegrations: Integration[];
  onSubmit: (input: AdGroupWithCampaignSchemaType) => void;
  initialData?: AdGroup & { campaign: Campaign };
}) {
  const [cubeIntegration, setCubeIntegration] = useState<
    typeof cubeIntegrations[0] | undefined
  >(undefined);
  const cubeProvider = providers.find(
    ({ id }) => id === cubeIntegration?.providerId
  );

  const methods = useForm<AdGroupWithCampaignSchemaType>({
    resolver: zodResolver(adGroupWithCampaignSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  const handleCmapaignChange = (campaignId: string) => {
    const campaign = campaigns.find((campaign) => campaign.id === campaignId);
    const cubeIntegration = campaign?.placement.integrations.find(
      (integration) => integration.provide === "CUBE"
    );
    console.log(cubeIntegration);
    setCubeIntegration(cubeIntegration);
  };
  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
      campaignId: initialData?.campaign.id,
    });

    if (initialData?.campaignId) {
      handleCmapaignChange(initialData?.campaignId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, initialData, campaigns, providers, cubeIntegrations]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="campaign-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              AdGroup
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Campaign</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("campaignId")}
                    defaultValue={initialData?.campaignId}
                    disabled={initialData ? true : false}
                    onChange={(e) => handleCmapaignChange(e.target.value)}
                  >
                    <option value="">Please choose</option>
                    {campaigns.map((campaign) => {
                      return (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.campaignId && (
                    <p role="alert">{errors.campaignId?.message}</p>
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
                <dt className="text-sm font-medium text-gray-500">Filter</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.filter || undefined}
                    rows={3}
                    {...register("filter")}
                  />
                  {cubeIntegration && (
                    <Controller
                      control={control}
                      name="filter"
                      render={({}) => (
                        <SegmentQueryBuilder
                          providerDetails={cubeProvider?.details}
                          integrationDetails={cubeIntegration?.details}
                          initialQuery={
                            initialData?.filter
                              ? parseJsonLogic(initialData?.filter)
                              : undefined
                          }
                          onQueryChange={(newQuery) => {
                            setValue(
                              "filter",
                              JSON.stringify(formatQuery(newQuery, "jsonlogic"))
                            );
                          }}
                          onPopulationChange={(newPopulation) => {
                            setValue("population", newPopulation);
                          }}
                        />
                      )}
                    />
                  )}

                  {errors.filter && (
                    <p role="alert">{errors.filter?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Population
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.population || undefined}
                    {...register("population")}
                    disabled
                  />
                  {errors.population && (
                    <p role="alert">{errors.population?.message}</p>
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

export default AdGroupForm;
