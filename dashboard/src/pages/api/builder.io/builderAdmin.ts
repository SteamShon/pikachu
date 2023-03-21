import { createAdminApiClient } from "@builder.io/admin-sdk";
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
