import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";
import { debounce, Grid } from "@mui/material";
import type { Cube, ServiceConfig } from "@prisma/client";
import { useSnackbar } from "notistack";
import { useEffect, useMemo, useState } from "react";
import type { RuleGroupType } from "react-querybuilder";
import QueryBuilder, { formatQuery } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.scss";
import {
  countPopulation,
  executeQuery,
  formatQueryCustom,
} from "../../utils/duckdb";
import AsyncValueEditor from "../common/AsyncValueEditor";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import * as ReactDnD from "react-dnd";
import * as ReactDndHtml5Backend from "react-dnd-html5-backend";

const emptyQuery: RuleGroupType = { combinator: "and", rules: [] };

function SegmentQueryBuilder({
  cube,
  initialQuery,
  onQueryChange,
  onPopulationChange,
}: {
  cube: Cube & { serviceConfig: ServiceConfig };
  initialQuery?: RuleGroupType;
  population?: string;
  onQueryChange: (newQuery: RuleGroupType) => void;
  onPopulationChange: (population: string) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState<RuleGroupType>(initialQuery || emptyQuery);
  const [, setPopulation] = useState<string | undefined>(undefined);
  const [metadata, setMetadata] = useState<Record<string, unknown>[]>([]);
  const [populationLoading, setPopulationLoading] = useState(false);

  const loadMetadata = useMemo(
    () => async (inputSql: string) => {
      if (!inputSql) {
        enqueueSnackbar("cube sql is empty.", { variant: "error" });
        return;
      }

      const sql = `DESCRIBE ${inputSql}`;
      const rows = await executeQuery(cube.serviceConfig, sql);
      enqueueSnackbar("finished loading metadata", { variant: "success" });
      setMetadata(rows);
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cube.serviceConfig]
  );

  const fetchPopulation = useMemo(
    () =>
      debounce((q?: RuleGroupType) => {
        (async () => {
          try {
            if (!q || !cube?.serviceConfig) return;
            const sql = formatQueryCustom(q);
            if (!sql) return;

            const count = await countPopulation({
              serviceConfig: cube.serviceConfig,
              sql: cube.sql || "",
              where: sql,
            });

            enqueueSnackbar("finished fetch population.", {
              variant: "success",
            });

            setPopulation(count);
            onPopulationChange(count);
          } finally {
            setPopulationLoading(false);
          }
        })();
      }, 1000),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (cube.sql) {
      loadMetadata(cube.sql);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cube.serviceConfig, cube.sql]);

  const fields = (metadata || []).map((row) => {
    const name = row.column_name as string;
    const type = row.column_type as string;
    const useSearch = true;

    // switch (type) {
    //   case "VARCHAR":
    //     useSearch = true;
    //     break;
    //   default:
    //     useSearch = false;
    //     break;
    // }
    return { name, label: `${name}(${type})`, columnType: type, useSearch };
    /*
    const type = row.column_type as string;
    if (name === "payment_type") {
      return { name, label: name, useSearch: true };
    }
    return { name: name, label: name, type };
    */
  });

  const operators = [
    { name: "in", label: "in" },
    { name: "notIn", label: "not in" },
  ];
  return (
    <>
      {fields.length > 0 && query ? (
        <Grid
          container
          direction="row"
          spacing={3}
          justifyContent="flex-start"
          // alignItems="stretch"
        >
          {/* <Grid item xs={12}>
        <Card>
          <Typography>{cube.sql}</Typography>
        </Card>
      </Grid> */}
          <Grid item xs={12}>
            <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}>
              <QueryBuilder
                key={cube.id}
                fields={fields}
                query={query}
                onQueryChange={(newQuery) => {
                  setQuery(newQuery);
                  onQueryChange(newQuery);
                }}
                controlElements={{
                  valueEditor: AsyncValueEditor,
                }}
                context={{ fields, cube }}
                controlClassnames={{ queryBuilder: "queryBuilder-branches" }}
                operators={operators}
              />
            </QueryBuilderDnD>
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
            {query ? (
              <span className="flex-wrap font-medium">
                {formatQuery(query, "sql")}
              </span>
            ) : null}
          </Grid>
        </Grid>
      ) : null}
    </>
  );
}

export default SegmentQueryBuilder;
