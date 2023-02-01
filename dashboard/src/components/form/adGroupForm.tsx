// import { api } from "../../utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingButton from "@mui/lab/LoadingButton";
import type { AdGroup } from "@prisma/client";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import { useEffect, useState } from "react";
import * as ReactDnD from "react-dnd";
import * as ReactDndHtml5Backend from "react-dnd-html5-backend";
import { FormProvider, useForm } from "react-hook-form";
import type { Field, RuleGroupType } from "react-querybuilder";
import { formatQuery, parseJsonLogic, QueryBuilder } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.scss";
import type { buildCampaignTree } from "../../utils/tree";
import type { AdGroupWithCampaignSchemaType } from "../schema/adGroup";
import { adGroupWithCampaignSchema } from "../schema/adGroup";

function AdGroupForm({
  campaigns,
  onSubmit,
  initialData,
}: {
  campaigns: ReturnType<typeof buildCampaignTree>[];
  onSubmit: (input: AdGroupWithCampaignSchemaType) => void;
  initialData?: AdGroup;
}) {
  const [loading, setLoading] = useState(false);
  const initialQuery: RuleGroupType = { combinator: "and", rules: [] };
  const [query, setQuery] = useState(
    initialData?.filter ? parseJsonLogic(initialData?.filter) : initialQuery
  );
  const fields: Field[] = [
    { name: "firstName", label: "First Name" },
    { name: "lastName", label: "Last Name" },
  ];

  const campaign = campaigns.length === 1 ? campaigns[0] : undefined;

  const methods = useForm<AdGroupWithCampaignSchemaType>({
    resolver: zodResolver(adGroupWithCampaignSchema),
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
      campaignId: campaign?.id,
    });
  }, [reset, campaign, initialData]);

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
                  {errors.filter && (
                    <p role="alert">{errors.filter?.message}</p>
                  )}
                  <QueryBuilderDnD
                    dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}
                  >
                    <QueryBuilder
                      fields={fields}
                      query={query}
                      onQueryChange={(q) => {
                        setQuery(q);
                        setValue(
                          "filter",
                          JSON.stringify(formatQuery(q, "jsonlogic"))
                        );
                      }}
                      showNotToggle={true}
                      showCombinatorsBetweenRules={true}
                      showCloneButtons={true}
                    />
                  </QueryBuilderDnD>
                  <pre>{JSON.stringify(formatQuery(query, "jsonlogic"))}</pre>
                </dd>
              </div>
            </dl>
          </div>
        </div>
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
      </form>
    </FormProvider>
  );
}

export default AdGroupForm;
