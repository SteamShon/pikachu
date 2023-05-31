import type { Provider } from "@prisma/client";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractValue, jsonParseWithFallback } from "../../../utils/json";
import { createHmac } from "crypto";
function getAuthHeader(provider?: Provider) {
  const now = new Date().toISOString();

  const genRanHex = (size: number) =>
    [...Array(size)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  const salt = genRanHex(64);
  const message = now + salt;
  const apiKey = extractValue({
    object: provider?.details,
    paths: ["apiKey"],
  }) as string | undefined;
  const apiSecret = extractValue({
    object: provider?.details,
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
async function getSenderList({ provider }: { provider?: Provider }) {
  const uri = `https://api.solapi.com/messages/v4/list?limit=1`;
  const headers = getAuthHeader(provider);
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
  provider,
  payload,
}: {
  provider?: Provider;
  payload?: Record<string, unknown>;
}) {
  const uri = extractValue({
    object: provider?.details,
    paths: ["uri"],
  }) as string | undefined;
  const headers = jsonParseWithFallback(
    extractValue({
      object: provider?.details,
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
  const config = req.body as Record<string, unknown>;
  const provider = config["provider"] as Provider | undefined;
  const method = config["method"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;
  console.log(config);

  if (!provider) {
    res.status(404).end();
  } else {
    try {
      if (method === "getSenderList") {
        const senderList = await getSenderList({ provider });
        res.json(senderList);
      } else if (method === "sendMessages") {
        const sendResult = await sendMessages({ provider, payload });
        res.json(sendResult);
      }
      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }
  }
};

export default handler;
