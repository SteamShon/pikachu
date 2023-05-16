// import { builder } from "@builder.io/react";
// import type { Builder, BuilderContent } from "@builder.io/react";
import { MyCache } from "../../../utils/cache";
// import type { ContentType, ServiceConfig } from "@prisma/client";
// import { extractBuilderPublicKey } from "../../../utils/serviceConfig";

// const pool = new MyCache<string, Builder>({
//   max: 3, // # of items
//   ttl: 1 * 60 * 1000, // expiration in ms (10 min)
// });

// function getClient(builderPublicKey: string) {
//   return pool.get(builderPublicKey, (k) => Promise.resolve(builder.init(k)));
// }

// export async function getContent({
//   serviceConfig,
//   contentType,
//   contentId,
// }: {
//   serviceConfig?: ServiceConfig | null;
//   contentType?: ContentType;
//   contentId?: string;
// }) {
//   const builderPublicKey = extractBuilderPublicKey(serviceConfig);
//   if (!builderPublicKey) return undefined;

//   const builder = await getClient(builderPublicKey);
//   const modelName = contentType?.name;
//   if (!modelName) return undefined;

//   if (!contentId) return undefined;

//   const content = await builder
//     .get(modelName, {
//       entry: contentId,
//       options: { noTargeting: true },
//     })
//     .promise();
//   console.log("getContent", builderPublicKey, modelName, contentId, content);
//   return content as BuilderContent<object>;
// }

// export async function getContents({
//   serviceConfig,
//   contentType,
// }: {
//   serviceConfig?: ServiceConfig | null;
//   contentType?: ContentType | null;
// }) {
//   const builderPublicKey = extractBuilderPublicKey(serviceConfig);
//   const modelName = contentType?.name;
//   if (!builderPublicKey || !modelName) return undefined;

//   const builder = await getClient(builderPublicKey);
//   const contents = await builder.getAll(modelName, {
//     limit: 1000,
//     options: { noTargeting: true },
//   });
//   return contents.map((c) => c as BuilderContent<object>);
// }
