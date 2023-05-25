import type { Provider } from "@prisma/client";
import axios from "axios";
import { createHmac } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractValue } from "../../../utils/json";
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
async function getRequestWithAuth({
  provider,
  uri,
}: {
  provider?: Provider;
  uri: string;
}) {
  const headers = getAuthHeader(provider);
  const { data } = await axios.get(uri, {
    headers,
  });

  return data;
}
async function getSenderList({ provider }: { provider?: Provider }) {
  const uri = `https://api.solapi.com/senderid/v1/numbers/active`;
  return await getRequestWithAuth({ uri, provider });
}
async function sendMessages({
  provider,
  payload,
}: {
  provider?: Provider;
  payload?: Record<string, unknown>;
}) {
  const uri = `https://api.solapi.com/messages/v4/send-many/detail`;

  const headers = getAuthHeader(provider);
  const { data } = await axios.post(uri, payload, {
    headers,
  });

  return data;
}
async function getMessageList({ provider }: { provider?: Provider }) {
  const uri = `https://api.solapi.com/messages/v4/list?limit=1`;
  return await getRequestWithAuth({ uri, provider });
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
      if (method === "getMessageList") {
        const messageList = await getMessageList({ provider });
        res.json(messageList);
      } else if (method === "getSenderList") {
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

    //const result = await upload(serviceConfig, cubeHistory);
    //if (result) res.status(200).end();
    //else res.status(500).end();
  }
};

export default handler;
