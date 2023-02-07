import S3 from "aws-sdk/clients/s3";
import { z } from "zod";
import { listFoldersRecursively } from "../../../utils/aws";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const awsRouter = createTRPCRouter({
  s3list: publicProcedure
    .input(
      z.object({
        bucketName: z.string().min(1),
        prefix: z.string().optional(),
        s3Config: z.object({
          region: z.string().optional().default("ap-northeast-2"),
          accessKeyId: z.string().min(1),
          secretAccessKey: z.string().min(1),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      const { bucketName, prefix, s3Config } = input;

      const s3 = new S3({
        ...s3Config,
        signatureVersion: "v4",
      });

      const folders = await listFoldersRecursively({
        s3,
        bucketName,
        prefix,
      });

      return folders;
    }),
});
