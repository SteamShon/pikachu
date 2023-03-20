import type { JSONObject, ModelType } from "@builder.io/admin-sdk";
import { createAdminApiClient } from "@builder.io/admin-sdk";
import type { ContentTypeInfo } from "@prisma/client";
import { MyCache } from "../../../utils/cache";

type ClientType = ReturnType<typeof createAdminApiClient>;

const pool = new MyCache<string, ClientType>({
  max: 3, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});

function getClient(builderPrivateKey: string) {
  return pool.get(builderPrivateKey, (k) =>
    Promise.resolve(createAdminApiClient(k))
  );
}

export async function getSettings({
  builderPrimaryKey,
}: {
  builderPrimaryKey: string;
}) {
  const adminSDK = await getClient(builderPrimaryKey);
  const settings = await adminSDK.query({
    settings: true,
  });
  return settings;
}
export async function getModels({
  builderPrivateKey,
}: {
  builderPrivateKey: string;
}) {
  const adminSDK = await getClient(builderPrivateKey);
  const { data } = await adminSDK.query({
    models: {
      everything: true,
    },
  });

  return (data?.models || []).map((model) => model.everything);
}

export function modelToContentTypeInfo(model: ModelType): ContentTypeInfo {
  const status = model.archived
    ? "archived"
    : model.publicReadable
    ? "published"
    : "created";
  const updatedAt = model.lastUpdateBy
    ? new Date(model.lastUpdateBy)
    : new Date();

  return {
    id: model.id || "",
    contentTypeId: "abc",
    details: model.everything as JSONObject,
    status: status,
    createdAt: new Date(),
    updatedAt,
  };
}
/*

// example creating a model from admin api
await adminSDK.chain.mutation
  .addModel({
    body: {
      defaultQuery: [],
      kind: "component",
      showTargeting: true,
      allowHeatmap: true,
      id: "xxxxxx",
      showMetrics: true,
      publicReadable: true,
      name: "announcement-bar",
      useQueryParamTargetingClientSide: false,
      fields: [
        {
          type: "uiBlocks",
          "@type": "@builder.io/core:Field",
          required: true,
          hideFromFieldsEditor: true,
          name: "blocks",
          showTemplatePicker: true,
        },
      ],
      helperText: "This model is for announcement bars",
      allowBuiltInComponents: true,
      bigData: false,
      strictPrivateWrite: false,
      requiredTargets: [],
      schema: {},
      examplePageUrl: "https://my.site.com/preview",
      webhooks: [],
      apiGenerated: true,
      showScheduling: true,
      showAbTests: true,
      pathPrefix: "/",
      componentsOnlyMode: false,
    },
  })
  .execute({});
*/
