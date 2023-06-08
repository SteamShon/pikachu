import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
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
import { toNewCreative } from "../../../utils/contentTypeInfo";
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
      field: "type",
      headerName: "Type",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return <>{params.row.contentType?.type}</>;
      },
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
        if (params.row?.contentType?.type === "DISPLAY") {
          return (
            <ContentPreview
              service={service}
              contentType={params.row?.contentType}
              creatives={[toNewCreative(params.row.values)]}
            />
          );
        }
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
      flex: 1.5,
      renderCell: (params) => {
        return (
          <div className="flex">
            <button
              className="p-1 text-red-400"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                  deleteContent({
                    contentTypeId: params.row.contentTypeId,
                    id: params.row.id,
                  });
                }
              }}
            >
              <DeleteIcon />
            </button>
            <button
              className="p-1 text-blue-400"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setContent(params.row);
                setModalOpen(true);
              }}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="p-1 text-blue-400"
              onClick={(e) => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    step: "creatives",
                  },
                });
              }}
            >
              <SouthIcon />
            </button>
            <button
              type="button"
              className="p-1 text-blue-400"
              onClick={(e) => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    step: "contentTypes",
                  },
                });
              }}
            >
              <NorthIcon />
            </button>
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
