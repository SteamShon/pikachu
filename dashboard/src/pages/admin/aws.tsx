import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TreeItem from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { Grid, TextField } from "@mui/material";
import { useState } from "react";
import TableMetadata from "../../components/common/TableMetadata";
import { api } from "../../utils/api";
import type { TreeNode } from "../../utils/aws";
import { buildPath, objectsToTree } from "../../utils/aws";
import type { S3Config } from "../../utils/duckdb";
import { jsonParseWithFallback } from "../../utils/json";

function AWS() {
  const bucketName = "pikachu-dev";
  const prefix = "dataset/";

  const [s3Config, setS3Config] = useState<S3Config | undefined>(undefined);

  return (
    <Grid container>
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
    </Grid>
  );
}

export default AWS;
