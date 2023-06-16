export const INTEGRATION_TEMPLATES = [
  {
    name: "CUBE",
    schema: {
      type: "object",
      properties: {
        SQL: {
          type: "string",
          title: "SQL",
        },
      },
      required: ["SQL"],
    },
  },
  {
    name: "SMS_SENDER",
    schema: {
      type: "object",
      properties: {
        URI: {
          type: "string",
          title: "URI",
        },
      },
      required: ["URI"],
    },
  },
  {
    name: "USER_FEATURE",
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
  },
  {
    name: "RANKER",
    schema: {
      type: "object",
      properties: {
        CLASS: {
          type: "string",
          title: "CLASS",
        },
      },
      required: ["CLASS"],
    },
  },
];
