import { TextField } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import type { S3Config } from "../../utils/duckdb";
import {
  fetchMetadata,
  loadDuckDB,
  ParquetMetadataColumns,
} from "../../utils/duckdb";
import { jsonParseWithFallback } from "../../utils/json";

function TableMetadata({ s3Path }: { s3Path?: string }) {
  const [metadata, setMetadata] = useState<{ [x: string]: unknown }[]>([]);
  const [s3Config, setS3Config] = useState<S3Config | undefined>(undefined);

  useEffect(() => {
    if (s3Path && s3Config) {
      console.log("fetch Metadata");

      loadDuckDB()
        .then((db) => {
          fetchMetadata(db, s3Path, s3Config)
            .then((rows) => {
              setMetadata(rows);
            })
            .catch((e) => console.error(e));
        })
        .catch((e) => console.error(e));
    }
  }, [s3Config, s3Path]);

  const rows = metadata || [];
  const columns = ParquetMetadataColumns.map((name) => {
    return { field: name, headerName: name, flex: 1 };
  });
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <TextField
        label="s3-config"
        multiline
        fullWidth
        onChange={(e) => {
          const parsed = jsonParseWithFallback(e.target.value);
          if (Object.keys(parsed).length > 0) {
            setS3Config(parsed as S3Config);
          }
        }}
      />
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          getRowId={(row) => row.path_in_schema as string}
          rows={rows}
          columns={columns}
          autoHeight
          getRowHeight={() => "auto"}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 30, 40, 50]}
          checkboxSelection
          disableSelectionOnClick
          experimentalFeatures={{ newEditingApi: true }}
          components={{
            Toolbar: GridToolbar,
          }}
        />
      </div>
    </div>
  );
}

export default TableMetadata;
