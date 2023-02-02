import { Typography } from "@mui/material";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

function ErrorMessage({ error }: { error?: unknown }) {
  const statusCode =
    error instanceof TRPCError ? getHTTPStatusCodeFromError(error) : undefined;

  return <Typography>Error: {statusCode}</Typography>;
}

export default ErrorMessage;
