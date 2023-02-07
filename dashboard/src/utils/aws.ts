import type { CubeConfig } from "@prisma/client";
import type { Buckets, Object as S3Object } from "aws-sdk/clients/s3";
import S3 from "aws-sdk/clients/s3";

export type TreeNode = {
  name: string;
  children: TreeNode[];
};
export function loadS3(config: CubeConfig): S3 {
  return new S3({
    region: config.s3Region,
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
    signatureVersion: "v4",
  });
}
export function buildPath(
  nodes: TreeNode[],
  paths: TreeNode[],
  targetNodeName: string
): TreeNode[] {
  const found = nodes.find((n) => n.name === targetNodeName);

  if (found) {
    return [...paths, found];
  }

  let subPaths: TreeNode[] = [];
  nodes.forEach((node) => {
    node.children.forEach((child) => {
      subPaths = buildPath([child], [...paths, node], targetNodeName);
      if (subPaths.length > 0) return subPaths;
    });
  });

  return subPaths;
}

export function objectsToTree({ paths }: { paths: S3Object[] }) {
  return paths.reduce((prev: TreeNode[], p) => {
    const names = p.Key?.split("/") || [];

    names.reduce((q, name) => {
      if (name === "") return q;

      let temp = q.find((o) => o.name === name);
      if (!temp) {
        q.push((temp = { name, children: [] }));
      }

      return temp.children;
    }, prev);

    return prev;
  }, []);
}
export async function listBuckets({
  s3,
}: {
  s3: S3;
}): Promise<Buckets | undefined> {
  const buckets = await s3.listBuckets().promise();
  return buckets.Buckets;
}
export async function listFoldersRecursively({
  s3,
  bucketName,
  prefix = "",
}: {
  s3: S3;
  bucketName: string;
  prefix?: string;
}) {
  let continuationToken: string | undefined;
  const folders: S3Object[] = [];

  do {
    const response = await s3
      .listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
      .promise();
    for (const item of response?.Contents || []) {
      if (item.Key && item.Key !== prefix) {
        folders.push(item);

        folders.push(
          ...(await listFoldersRecursively({
            s3,
            bucketName,
            prefix: item.Key,
          }))
        );
      }
    }
    continuationToken = response?.NextContinuationToken;
  } while (continuationToken);

  return folders;
}
