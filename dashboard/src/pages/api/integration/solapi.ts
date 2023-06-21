import type { Prisma } from "@prisma/client";
import axios from "axios";
import { createHmac } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractValue, jsonParseWithFallback } from "../../../utils/json";

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

async function getMessageList({ details }: { details?: Prisma.JsonValue }) {
  const uri = `https://api.solapi.com/messages/v4/list?limit=1`;

  const headers = getAuthHeader(details);
  try {
    const { data } = await axios.get(uri, {
      headers,
    });

    return data;
  } catch (e) {
    console.log(e);
  }
}
async function getSenderList({ details }: { details?: Prisma.JsonValue }) {
  const uri = `https://api.solapi.com/messages/v4/list?limit=1`;
  const headers = getAuthHeader(details);
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
  details,
  payload,
}: {
  details?: Prisma.JsonValue;
  payload?: Record<string, unknown>;
}) {
  const uri = extractValue({
    object: details,
    paths: ["uri"],
  }) as string | undefined;
  const headers = jsonParseWithFallback(
    extractValue({
      object: details,
      paths: ["headers"],
    }) as string | undefined
  ) as Record<string, string>;
  if (!uri || Object.keys(headers).length === 0) return;
  // const uri = `https://api.solapi.com/messages/v4/send-many/detail`;

  // const headers = getAuthHeader(provider);
  const { data } = await axios.post(uri, payload, {
    headers,
    timeout: 5000,
  });

  return data;
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const config = req.body as Record<string, unknown>;
  const details = config["details"] as Prisma.JsonValue | undefined;
  const route = config["route"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;
  console.log(config);

  if (!details) {
    res.status(404).end();
  } else {
    try {
      if (route === "getMessageList") {
        const messageList = await getMessageList({ details });
        res.json(messageList);
      }
      if (route === "getSenderList") {
        const senderList = await getSenderList({
          details,
        });
        res.json(senderList);
      } else if (route === "sendMessages") {
        const sendResult = await sendMessages({
          details,
          payload,
        });
        res.json(sendResult);
      }
      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }
  }
};

export default handler;
