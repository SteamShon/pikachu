import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Creative } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { LivePreview, LiveProvider } from "react-live";
import { replacePropsInFunction } from "../../../components/common/CodeTemplate";

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
  const { contentTypeIds, contentIds } = router.query;
  const [content, setContent] = useState<
    Parameters<typeof ContentForm>[0]["initialData"] | undefined
  >(undefined);

  const selectedIds = (contentTypeIds || []) as string[];

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

  const contentTypes =
    selectedIds.length === 0
      ? allContentTypes
      : allContentTypes.filter((contentType) => {
          return selectedIds.includes(contentType.id);
        });

  const rows = contentTypes.flatMap((contentType) => {
    return Object.values(contentType.contents).map((content) => {
      return { ...content, contentType };
    });
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    {
      field: "contentType.name",
      headerName: "ContentType",
      flex: 1,
      valueGetter: (params) => {
        return params.row.contentType.name;
      },
    },
    {
      field: "creatives.count",
      headerName: "Creatives",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return (
          <ol>
            {params.row.creatives.map((creative: Creative) => {
              return <li key={creative.id}>{creative.name}</li>;
            })}
          </ol>
        );
      },
    },
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
      field: "preview",
      headerName: "Preview",
      flex: 4,
      renderCell: (params: GridRenderCellParams<Date>) => {
        const code = replacePropsInFunction({
          code: params.row?.contentType?.uiSchema,
          contents: [jsonParseWithFallback(params.row.values)],
        });
        return (
          <LiveProvider code={code} noInline={true}>
            <LivePreview />
          </LiveProvider>
        );
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
          selectionModel={(contentIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            if (ids && Array.isArray(ids)) {
              router.query.contentIds = ids.map((id) => String(id));
              router.push(router);
            }
          }}
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
