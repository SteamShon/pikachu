// import { BuilderComponent } from "@builder.io/react";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SouthIcon from "@mui/icons-material/South";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Placement } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import ContentPreview from "../../../components/builder/contentPreview";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type ContentTypeForm from "../../../components/form/contentType/contentTypeForm";
import ContentTypeModal from "../../../components/form/contentType/contentTypeModal";
import { api } from "../../../utils/api";
import {
  extractDefaultValues,
  extractSchema,
  toNewCreative,
} from "../../../utils/contentType";
import { jsonParseWithFallback } from "../../../utils/json";
import { fromServiceTree, toServiceTree } from "../../../utils/tree";

function ContentTypeTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof ContentTypeForm>[0]["service"];
  serviceTree?: ReturnType<typeof toServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [contentType, setContentType] = useState<
    Parameters<typeof ContentTypeForm>[0]["initialData"] | undefined
  >(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const { contentTypeIds } = router.query;

  const { mutate: deleteContentType } = api.contentType.remove.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        delete prev.contentTypes[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });
  const placements = Object.values(serviceTree?.placements || {})
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ campaigns, ...placement }) => {
      return { ...placement };
    })
    .reduce((prev, placement) => {
      prev[placement.contentTypeId] = placement;
      return prev;
    }, {} as Record<string, Placement>);

  const rows = serviceTree?.contentTypes
    ? Object.values(serviceTree.contentTypes).map((contentType) => {
        return {
          ...contentType,
          placement: placements[contentType.id],
          contents: Object.values(contentType.contents),
        };
      })
    : [];

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 2,
    },

    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
    {
      field: "source",
      headerName: "Source",
      flex: 1,
    },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
    },
    {
      field: "schema",
      headerName: "Schema",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return (
          <>
            {params.row.type === "DISPLAY" && (
              <JsonForms
                schema={jsonParseWithFallback(extractSchema(params.row))}
                //uischema={uiSchema}
                data={jsonParseWithFallback(extractDefaultValues(params.row))}
                renderers={materialRenderers}
                cells={materialCells}
              />
            )}
          </>
        );
      },
    },
    {
      field: "preview",
      headerName: "Preview",
      flex: 3,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return (
          <>
            <ContentPreview
              service={service}
              contentType={params.row}
              creatives={[toNewCreative(extractDefaultValues(params.row))]}
            />
          </>
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
                  if (params.row.placement) {
                    alert(
                      `placement ${params.row.placement.name} is using this. make sure update placement not to use this contentType first then you can delete this.`
                    );
                    return;
                  }

                  deleteContentType({
                    serviceId: service.id,
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
                setContentType(params.row);
                setModalOpen(true);
              }}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="p-1 text-blue-400"
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    step: "contents",
                    contentTypeId: params.row.id,
                  },
                });
              }}
            >
              <SouthIcon />
            </button>
          </div>
        );
      },
    },
  ];

  const toolbar = GridCustomToolbar({
    label: "Create",
    onClick: () => {
      setContentType(undefined);
      setModalOpen(true);
    },
  });

  return (
    <>
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
            selectionModel={(contentTypeIds || []) as string[]}
            onSelectionModelChange={(ids) => {
              if (ids && Array.isArray(ids)) {
                router.query.contentTypeIds = ids.map((id) => String(id));
                router.push(router);
              }
            }}
            components={{
              Toolbar: toolbar,
            }}
          />
        </div>
        {serviceTree && (
          <ContentTypeModal
            key="contentTypeModal"
            service={fromServiceTree(serviceTree)}
            initialData={contentType}
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            setServiceTree={setServiceTree}
          />
        )}
      </div>
    </>
  );
}

export default ContentTypeTable;
