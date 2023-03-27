import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import ContentPreview from "../../../components/builder/contentPreview";
import ContentSync from "../../../components/builder/contentSync";

import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type ContentForm from "../../../components/form/contentForm";
import ContentModal from "../../../components/form/contentModal";
import { api } from "../../../utils/api";
import { jsonParseWithFallback } from "../../../utils/json";
import type { buildServiceTree } from "../../../utils/tree";
import { buildContentTypeTree } from "../../../utils/tree";
function ContentTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof ContentForm>[0]["service"];
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const { contentTypeId } = router.query;
  const [content, setContent] = useState<
    Parameters<typeof ContentForm>[0]["initialData"] | undefined
  >(undefined);

  const { mutate: deleteContent } = api.contentType.removeContent.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;

        prev.contentTypes[deleted.id] = buildContentTypeTree(deleted);
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allContentTypes = serviceTree
    ? Object.values(serviceTree.contentTypes)
    : [];

  const contentTypes = contentTypeId
    ? allContentTypes.filter((contentType) => contentType.id === contentTypeId)
    : allContentTypes;

  const rows = contentTypes.flatMap((contentType) => {
    return Object.values(contentType.contents).map((content) => {
      return { ...content, contentType };
    });
  });

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
    {
      field: "update",
      headerName: "Update",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return (
          <ContentSync
            serviceConfig={service?.serviceConfig || undefined}
            contentType={params.row?.contentType}
            contents={[jsonParseWithFallback(params.row.values)]}
          />
        );
      },
    },
    {
      field: "preview",
      headerName: "Preview",
      flex: 4,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return (
          <ContentPreview
            contentType={params.row?.contentType}
            contents={[jsonParseWithFallback(params.row.values)]}
          />
        );
      },
    },
    {
      field: "creatives.count",
      headerName: "# of Creatives",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return <>{params.row.creatives.length}</>;
      },
    },
    {
      field: "createdAt",
      headerName: "CreatedAt",
      flex: 1,
      valueFormatter: (params) =>
        moment(params?.value).format("YYYY/MM/DD hh:mm A"),
    },
    {
      field: "updatedAt",
      headerName: "UpdatedAt",
      flex: 1,
      valueFormatter: (params) =>
        moment(params?.value).format("YYYY/MM/DD hh:mm A"),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => {
        return (
          <div className="inline-block">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                  deleteContent({
                    contentTypeId: params.row.contentTypeId,
                    id: params.row.id,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setContent(params.row);
                setModalOpen(true);
              }}
              startIcon={<EditIcon />}
            ></Button>
          </div>
        );
      },
    },
  ];

  const toolbar = GridCustomToolbar({
    label: "Create",
    onClick: () => {
      setContent(undefined);
      setModalOpen(true);
    },
  });

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid
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
            Toolbar: toolbar,
          }}
        />
      </div>
      <ContentModal
        key="contentModal"
        service={service}
        contentTypes={contentTypes}
        initialData={content}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default ContentTable;
