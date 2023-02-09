import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import DragIndicator from "@mui/icons-material/DragIndicator";
import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Button,
  Card,
  Checkbox,
  createTheme,
  debounce,
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
import type { Cube, CubeConfig } from "@prisma/client";
import { QueryBuilderMaterial } from "@react-querybuilder/material";
import { useEffect, useMemo, useState } from "react";
import type { Operator, RuleGroupType } from "react-querybuilder";
import QueryBuilder, { formatQuery } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.scss";
import {
  countPopulation,
  fetchParquetSchema,
  loadDuckDB,
} from "../../utils/duckdb";
import AsyncValueEditor from "../common/AsyncValueEditor";

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

function SegmentQueryBuilder({
  cube,
  query,
  onQueryChange,
  onPopulationChange,
}: {
  cube: Cube & { cubeConfig: CubeConfig };
  query?: RuleGroupType;
  population?: string;
  onQueryChange: (newQuery: RuleGroupType) => void;
  onPopulationChange: (population: string) => void;
}) {
  const [db] = useState<AsyncDuckDB | undefined>(undefined);
  const [metadata, setMetadata] = useState<{ [x: string]: unknown }[]>([]);
  const [populationLoading, setPopulationLoading] = useState(false);

  const loadMetadata = useMemo(
    () => async () => {
      const duckDB = db ? db : await loadDuckDB(cube.cubeConfig);
      console.log("start initialize");

      const rows = await fetchParquetSchema(duckDB, cube.s3Path);
      setMetadata(rows);
    },
    [cube.cubeConfig, cube.s3Path, db]
  );

  const fetchPopulation = useMemo(
    () =>
      debounce((q?: RuleGroupType) => {
        (async () => {
          if (!q) return;

          const duckDB = db ? db : await loadDuckDB(cube.cubeConfig);
          console.log("fetch population");

          const sql = formatQuery(q, "sql");
          const count = await countPopulation({
            db: duckDB,
            path: cube.s3Path,
            where: sql,
          });

          setPopulationLoading(false);
          onPopulationChange(count);
        })();
      }, 1000),

    [cube.cubeConfig, cube.s3Path, db, onPopulationChange]
  );

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

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
      spacing={3}
      justifyContent="flex-start"
      // alignItems="stretch"
    >
      <Grid item xs={12}>
        <Card>
          <Typography>{cube.s3Path}</Typography>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <ThemeProvider theme={muiTheme}>
          <QueryBuilderMaterial muiComponents={muiComponents}>
            <QueryBuilder
              fields={fields}
              query={query || initialQuery}
              onQueryChange={onQueryChange}
              getOperators={getOperators}
              controlElements={{
                valueEditor: AsyncValueEditor,
              }}
              context={{ fields, cube }}
            />
          </QueryBuilderMaterial>
        </ThemeProvider>
      </Grid>
      <Grid item xs={8}></Grid>
      <Grid item xs={3}>
        <LoadingButton
          type="button"
          variant="contained"
          loadingPosition="end"
          endIcon={<SendIcon />}
          onClick={() => {
            setPopulationLoading(true);
            fetchPopulation(query);
          }}
          loading={populationLoading}
          className="inline-flex w-full justify-end rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          <span>Calculate Population</span>
        </LoadingButton>
      </Grid>
      <Grid item xs={1}></Grid>
      <Grid item xs={12}>
        {query ? <pre>SQL: {formatQuery(query, "sql")}</pre> : null}
      </Grid>
    </Grid>
  );
}

export default SegmentQueryBuilder;
