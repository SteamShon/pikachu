import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";

import { useState } from "react";

import type { Prisma } from "@prisma/client";
import { executeQuery } from "../../utils/awsS3DuckDB";
import QueryResultTable from "../common/QueryResultTable";

function SqlPreview({
  details,
  sql,
}: {
  details?: Prisma.JsonValue;
  sql: string;
}) {
  const [rows, setRows] = useState<{ [x: string]: unknown }[]>([]);
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    setLoading(true);
    const withLimit = `${sql} LIMIT 100`;
    const result = await executeQuery({
      details,
      query: withLimit,
    });
    setRows(result);
    setLoading(false);
  };

  return (
    <>
      <div>
        <QueryResultTable rows={rows} />
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <LoadingButton
          type="submit"
          variant="contained"
          loadingPosition="end"
          endIcon={<SendIcon />}
          onClick={() => runQuery()}
          loading={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          <span>Run Query</span>
        </LoadingButton>
      </div>
    </>
  );
}

export default SqlPreview;
