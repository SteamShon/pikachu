import type { Prisma } from "@prisma/client";
import axios from "axios";
import { checkConnection, extractConfigs } from "./awsS3DuckDB";

export const PROVIDER_TEMPLATES = [
  {
    name: "AWS_S3",
    schema: {
      type: "object",
      properties: {
        aws_access_key_id: {
          type: "string",
          title: "aws_access_key_id",
        },
        aws_secret_access_key: {
          type: "string",
          title: "aws_secret_access_key",
        },
        region: {
          type: "string",
          enum: ["ap-northeast-2"],
        },
        buckets: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["aws_access_key_id", "aws_secret_access_key", "buckets"],
    },
    validate: async (details: Prisma.JsonValue) => {
      // const result = await axios.post("/api/integration/awsS3DuckDB", {
      //   route: "checkConnection",
      //   details,
      // });
      // return result.status === 200;
      const configs = extractConfigs(details);
      if (!configs) return false;
      return checkConnection(configs);
    },
  },
  {
    name: "SOLAPI",
    schema: {
      type: "object",
      properties: {
        apiKey: {
          type: "string",
          title: "apiKey",
        },
        apiSecret: {
          type: "string",
          title: "apiSecret",
        },
      },
      required: ["apiKey", "apiSecret"],
    },
    validate: async (details: Prisma.JsonValue) => {
      try {
        const result = await axios.post("/api/integration/solapi", {
          route: "getMessageList",
          providerDetails: details,
        });
        return result.status === 200;
      } catch (e) {
        return false;
      }
    },
  },
  {
    name: "DATABASE_PRISMA",
    schema: {
      type: "object",
      properties: {
        DATABASE_URL: {
          type: "string",
          title: "DATABASE_URL",
        },
      },
      required: ["DATABASE_URL"],
    },
    validate: async (details: Prisma.JsonValue) => {
      try {
        const result = await axios.post("/api/integration/pg", {
          route: "checkConnection",
          details,
        });
        return result.status === 200;
      } catch (e) {
        return false;
      }
    },
  },
];
