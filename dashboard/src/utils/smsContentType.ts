import type { Prisma } from "@prisma/client";

const example = {
  from: "010-8940-5798",
  template:
    "Hi. This is the test message for {{userId}}. your phone number is {{phone_number}} {{genres}} def\n\nIf you want to know more, click {{click_url}}\n\n{{button_url}}",
  columns: [
    {
      column_name: "userId",
      column_type: "INTEGER",
    },
    {
      column_name: "ratedMovieIds",
      column_type: "INTEGER[]",
    },
    {
      column_name: "genres",
      column_type: "VARCHAR[]",
    },
    {
      column_name: "phone_number",
      column_type: "VARCHAR",
    },
  ],
  testTos: "010-8940-5798",
  toColumn: "phone_number",
  defaultValues:
    '{"text":"This is the {{user_name}} {{userId}}","from":"010-8940-5798"}',
  smsIntegrationId: "clix63s7i0009s4unnhrmwq63",
  cubeIntegrationId: "clix61nrn0007s4uneat1rpnw",
};

export type SMSContentTypeDetail = typeof example;

export function toSmsContentTypeDetails(details?: Prisma.JsonValue) {
  try {
    if (!details) return undefined;

    return details as Partial<SMSContentTypeDetail>;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
