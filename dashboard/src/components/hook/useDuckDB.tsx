import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { useEffect, useState } from "react";
import { loadDuckDB } from "../../utils/duckdb";

function useDuckDB() {
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);

  useEffect(() => {
    loadDuckDB()
      .then((db) => setDB(db))
      .catch((e) => console.error(e));
  }, []);

  return { db };
}

export default useDuckDB;
