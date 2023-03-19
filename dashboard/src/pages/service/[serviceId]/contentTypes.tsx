import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Creative } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useState } from "react";
import { LivePreview, LiveProvider } from "react-live";
import { replacePropsInFunction } from "../../../components/common/CodeTemplate";

import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type ContentForm from "../../../components/form/contentForm";
import ContentModal from "../../../components/form/contentModal";
import { api } from "../../../utils/api";
import { jsonParseWithFallback } from "../../../utils/json";
import { buildServiceTree } from "../../../utils/tree";
import { buildContentTypeTree } from "../../../utils/tree";

function ContentTypes() {
  const router = useRouter();

  const { serviceId, step } = router.query;

  const [tree, setTree] = useState<
    ReturnType<typeof buildServiceTree> | undefined
  >(undefined);

  const { data: service, isLoading } = api.service.get.useQuery({
    id: serviceId as string,
  });

  useEffect(() => {
    if (service) {
      setTree(buildServiceTree(service));
    }
  }, [service]);

  const contentTypes = service?.contentTypes || [];

  return (
    <>
      {contentTypes.map((contentType) => {
        return <p key={contentType.id}>{JSON.stringify(contentType)}</p>;
      })}
    </>
  );
}

export default ContentTypes;
