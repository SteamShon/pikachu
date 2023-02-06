import S3 from "aws-sdk/clients/s3";
import type { Object as S3Object } from "aws-sdk/clients/s3";

const s3 = new S3({
  region: "ap-northeast-2",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  signatureVersion: "v4",
});

interface TreeNode {
  name: string;
  children: TreeNode[];
}

export function objectsToTree({ paths }: { paths: S3Object[] }) {
  return paths.reduce((prev: TreeNode[], p) => {
    const names = p.Key?.split("/") || [];

    names.reduce((q, name) => {
      let temp = q.find((o) => o.name === name);
      if (!temp) q.push((temp = { name, children: [] }));
      return temp.children;
    }, prev);

    return prev;
  }, []);
}

export async function listFoldersRecursively({
  bucketName,
  prefix = "",
}: {
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
          ...(await listFoldersRecursively({ bucketName, prefix: item.Key }))
        );
      }
    }
    continuationToken = response?.NextContinuationToken;
  } while (continuationToken);

  return folders;
}
