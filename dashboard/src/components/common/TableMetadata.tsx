import {
  Button,
  Card,
  Checkbox,
  createTheme,
  FormControl,
  FormControlLabel,
  Grid,
  Input,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextareaAutosize,
  ThemeProvider,
  Typography,
} from "@mui/material";
import DragIndicator from "@mui/icons-material/DragIndicator";
import type { Cube, CubeConfig } from "@prisma/client";
import { QueryBuilderMaterial } from "@react-querybuilder/material";
import { useEffect, useMemo, useState } from "react";
import type {
  Operator,
  OptionList,
  RuleGroupType,
  ValueEditorType,
} from "react-querybuilder";
import QueryBuilder, { formatQuery } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.scss";
import {
  fetchParquetSchema,
  fetchValues,
  loadDuckDB,
} from "../../utils/duckdb";
import AsyncValueEditor from "./AsyncValueEditor";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
const muiTheme = createTheme();

const muiComponents = {
  Button,
  Checkbox,
  DragIndicator,
  FormControl,
  FormControlLabel,
  Input,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextareaAutosize,
};

const initialQuery: RuleGroupType = { combinator: "and", rules: [] };

function TableMetadata({ cube }: { cube: Cube & { cubeConfig: CubeConfig } }) {
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);
  const [metadata, setMetadata] = useState<{ [x: string]: unknown }[]>([]);
  const [query, setQuery] = useState<RuleGroupType>(initialQuery);

  const loadMetadata = useMemo(
    () => async () => {
      const duckDB = db ? db : await loadDuckDB(cube.cubeConfig);
      console.log("start initialize");

      const rows = await fetchParquetSchema(duckDB, cube.s3Path);
      setMetadata(rows);
    },
    []
  );

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const rows = (metadata || []).map((row, idx) => {
    row.rowId = String(idx);
    return row;
  });

  const fields = (metadata || []).map((row) => {
    const name = row.name as string;
    const type = row.type as string;
    if (name === "payment_type") {
      return { name, label: name, useSearch: true };
    }
    return { name: name, label: name, type };
  });
  const getOperators = (fieldName: string): Operator[] => {
    const field = fields.find((f) => f.name === fieldName);

    if (!field) return [];
    if (field.name === "payment_type") {
      return [{ name: "in", label: "in" }];
    }

    switch (field.type) {
      case "BOOLEAN":
        return [{ name: "=", label: "=" }];
      case "INT64":
      case "DOUBLE":
        return [
          { name: "=", label: "=" },
          { name: "!=", label: "!=" },
          { name: "<", label: "<" },
          { name: ">", label: ">" },
          { name: "<=", label: "<=" },
          { name: ">=", label: ">=" },
          { name: "=", label: "=" },
          { name: "!=", label: "!=" },
          { name: "<", label: "<" },
          { name: ">", label: ">" },
          { name: "<=", label: "<=" },
          { name: ">=", label: ">=" },
        ];
      default:
        return [];
    }
  };

  return (
    <Grid
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="stretch"
    >
      <Grid item xs={12}>
        <Card>
          <Typography>{cube.s3Path}</Typography>
        </Card>
      </Grid>
      <Grid item xs={2}>
        <h4>Query Builder</h4>
      </Grid>
      <Grid item xs={10}>
        {/* <DataGrid
          getRowId={(row) => row.rowId as string}
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
        /> */}
        <ThemeProvider theme={muiTheme}>
          <QueryBuilderMaterial muiComponents={muiComponents}>
            <QueryBuilder
              fields={fields}
              query={query}
              onQueryChange={(q) => setQuery(q)}
              getOperators={getOperators}
              controlElements={{
                valueEditor: AsyncValueEditor,
              }}
              context={{ fields, cube }}
            />
          </QueryBuilderMaterial>
        </ThemeProvider>
      </Grid>
      <Grid item xs={2}>
        <h4>SQL</h4>
      </Grid>
      <Grid item xs={10}>
        <pre>{formatQuery(query, "sql")}</pre>
      </Grid>
    </Grid>
  );
}

export default TableMetadata;
