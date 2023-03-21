import { builder } from "@builder.io/react";
import type { Builder } from "@builder.io/react";
import { MyCache } from "../../../utils/cache";

const pool = new MyCache<string, Builder>({
  max: 3, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});

function getClient(builderPublicKey: string) {
  return pool.get(builderPublicKey, (k) => Promise.resolve(builder.init(k)));
}

export async function getContent({
  builderPublicKey,
  modelName,
  contentId,
}: {
  builderPublicKey: string;
  modelName: string;
  contentId: string;
}) {
  const builder = await getClient(builderPublicKey);
  const content = await builder
    .get(modelName, { query: { id: contentId } })
    .promise();

  return content;
}
export async function getContents({
  builderPublicKey,
  modelName,
  options,
}: {
  builderPublicKey: string;
  modelName: string;
  options: { limit: number; userAttributes: { urlPath: string } };
}) {
  const builder = await getClient(builderPublicKey);
  const contents = await builder.getAll(modelName, {
    limit: options.limit,
    userAttributes: {
      urlPath: options.userAttributes.urlPath,
    },
  });
  return contents;
}
