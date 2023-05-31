// async/await
import { Provider } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  extractS3AccessKeyId,
  extractS3SecretAccessKey,
  extractS3Region,
  extractS3Buckets,
  loadS3,
  listFoldersRecursively,
} from "../../../utils/providers/awsS3DuckDB";

async function checkConnection(provider: Provider) {
  const s3 = loadS3(provider);
  const accessKeyId = extractS3AccessKeyId(provider);
  const secretAccessKey = extractS3SecretAccessKey(provider);
  const region = extractS3Region(provider);
  const buckets = extractS3Buckets(provider);

  if (!accessKeyId || !secretAccessKey || !region || !buckets) {
    return false;
  } else {
    const bucketName = buckets.split(",")[0];
    if (!bucketName) return false;
    try {
      await listFoldersRecursively({ s3, bucketName });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = req.body as Provider;
  const accessKeyId = extractS3AccessKeyId(provider);
  const secretAccessKey = extractS3SecretAccessKey(provider);
  const region = extractS3Region(provider);
  const buckets = extractS3Buckets(provider);
  if (!accessKeyId || !secretAccessKey || !region || !buckets) {
    res.status(404).end();
  } else {
    try {
      const result = await checkConnection(provider);
      res.json(result);
      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }
  }
};

export default handler;
