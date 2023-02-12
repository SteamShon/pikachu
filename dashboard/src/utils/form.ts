export type FormData = {
  source: {
    alias: string;
  };
  join: [
    {
      target: {
        alias: string;
      };
      condition: string;
    }
  ];
};
