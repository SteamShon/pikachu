import type { UseFormReturn } from "react-hook-form";
import type { DatasetSchemaType } from "../schema/dataset";

function JoinTableBuilder({
  methods,
  index,
}: {
  methods: UseFormReturn<DatasetSchemaType, unknown>;
  index: number;
}) {}

export default JoinTableBuilder;
