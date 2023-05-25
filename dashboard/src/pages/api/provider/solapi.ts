import type { Channel, Provider } from "@prisma/client";
import { extractValue } from "../../../utils/json";
import { createHmac } from "crypto";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

async function getMessageList({ provider }: { provider?: Provider }) {
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

  if (!apiKey || !apiSecret) return;

  const signature = createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");

  const uri = `https://api.solapi.com/messages/v4/list?limit=1`;
  const { data } = await axios.get(uri, {
    headers: {
      Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${now}, salt=${salt}, signature=${signature}`,
    },
  });

  return data;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const provider = config["provider"] as Provider | undefined;
  console.log(config);

  if (!provider) {
    res.status(404).end();
  } else {
    try {
      const messageList = await getMessageList({ provider });

      res.json(messageList);
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
