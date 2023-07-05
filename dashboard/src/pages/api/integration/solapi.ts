import type { Prisma } from "@prisma/client";
import axios from "axios";
import { createHmac } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractValue } from "../../../utils/json";

function getAuthHeader(details?: Prisma.JsonValue) {
  const now = new Date().toISOString();

  const genRanHex = (size: number) =>
    [...Array(size)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  const salt = genRanHex(64);
  const message = now + salt;
  const apiKey = extractValue({
    object: details,
    paths: ["apiKey"],
  }) as string | undefined;
  const apiSecret = extractValue({
    object: details,
    paths: ["apiSecret"],
  }) as string | undefined;

  if (!apiKey || !apiSecret) return {};

  const signature = createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");

  return {
    Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${now}, salt=${salt}, signature=${signature}`,
  };
}

async function getMessageList({
  providerDetails,
}: {
  providerDetails?: Prisma.JsonValue;
}) {
  const uri = `https://api.solapi.com/messages/v4/list?limit=1`;

  const headers = getAuthHeader(providerDetails);
  try {
    const { data } = await axios.get(uri, {
      headers,
    });

    return data;
  } catch (e) {
    console.log(e);
  }
}
async function getSenderList({
  providerDetails,
  integrationDetails,
}: {
  providerDetails?: Prisma.JsonValue;
  integrationDetails?: Prisma.JsonValue;
}) {
  const uri = extractValue({ object: integrationDetails, paths: ["uri"] }) as
    | string
    | undefined;
  const headers = getAuthHeader(providerDetails);
  if (!uri) return;

  try {
    const { data } = await axios.get(uri, {
      headers,
    });

    return data;
  } catch (e) {
    console.log(e);
  }
}
async function sendMessages({
  providerDetails,
  integrationDetails,
  payload,
}: {
  providerDetails?: Prisma.JsonValue;
  integrationDetails?: Prisma.JsonValue;
  payload?: Record<string, unknown>;
}) {
  const uri = extractValue({
    object: integrationDetails,
    paths: ["uri"],
  }) as string | undefined;
  const headers = getAuthHeader(providerDetails);

  if (!uri || Object.keys(headers).length === 0) return;
  // const uri = `https://api.solapi.com/messages/v4/send-many/detail`;

  // const headers = getAuthHeader(provider);
  try {
    const { status } = await axios.post(uri, payload, {
      headers,
      timeout: 5000,
    });

    return status === 200;
  } catch (error) {
    console.log(error);
    return false;
  }
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const providerDetails = config["providerDetails"] as
    | Prisma.JsonValue
    | undefined;
  const integrationDetails = config["integrationDetails"] as
    | Prisma.JsonValue
    | undefined;

  const route = config["route"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;
  console.log(config);

  try {
    if (route === "getMessageList") {
      if (!providerDetails) {
        res.status(404).end();
        return;
      }

      const messageList = await getMessageList({
        providerDetails,
      });
      res.json(messageList);
    }
    if (route === "getSenderList") {
      if (!providerDetails || !integrationDetails) {
        res.status(404).end();
        return;
      }

      const senderList = await getSenderList({
        providerDetails,
        integrationDetails,
      });
      res.json(senderList);
    } else if (route === "sendMessages") {
      if (!providerDetails || !integrationDetails || !payload) {
        res.status(404).end();
        return;
      }

      const sendResult = await sendMessages({
        providerDetails,
        integrationDetails,
        payload,
      });
      res.status(sendResult ? 200 : 500);
      res.json(sendResult);
    }
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

export default handler;
