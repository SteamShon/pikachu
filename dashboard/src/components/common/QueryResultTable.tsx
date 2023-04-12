import type { GridColDef } from "@mui/x-data-grid";
import { GridToolbar } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

function QueryResultTable({ rows }: { rows: { [x: string]: unknown }[] }) {
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  const columns: GridColDef[] = keys.map((key) => {
    return {
      field: key,
      headerName: key,
      flex: 1,
      valueFormatter: (params) => {
        return typeof params.value === "object"
          ? JSON.stringify(params.value, null, 2)
          : params.value;
      },
    };
  });
  const innerRows = rows.map((row, index) => {
    return { ...row, id: String(index) };
  });

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          rows={innerRows}
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

export default QueryResultTable;
