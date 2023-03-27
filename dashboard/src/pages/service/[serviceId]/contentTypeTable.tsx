import { BuilderComponent } from "@builder.io/react";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type {
  ContentType,
  ContentTypeInfo,
  Service,
  ServiceConfig,
} from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { LivePreview, LiveProvider } from "react-live";
import { replacePropsInFunction } from "../../../components/common/CodeTemplate";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type ContentTypeForm from "../../../components/form/contentTypeForm";
import ContentTypeModal from "../../../components/form/contentTypeModal";
import { api } from "../../../utils/api";
import {
  extractCode,
  extractDefaultValues,
  extractSchema,
} from "../../../utils/contentTypeInfo";
import { jsonParseWithFallback } from "../../../utils/json";
import { extractBuilderPublicKey } from "../../../utils/serviceConfig";
import type { buildServiceTree } from "../../../utils/tree";
import { buildContentTypesTree } from "../../../utils/tree";

function ContentTypeTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [contentType, setContentType] = useState<
    Parameters<typeof ContentTypeForm>[0]["initialData"] | undefined
  >(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const { contentTypeIds } = router.query;

  const { mutate: deleteContentType } =
    api.service.removeContentType.useMutation({
      onSuccess(deleted) {
        setServiceTree((prev) => {
          if (!prev) return prev;
          prev.contentTypes = buildContentTypesTree(deleted.contentTypes);
          return prev;
        });
        setModalOpen(false);
      },
    });

  const renderBuilderPreview = (
    service: Service & { serviceConfig?: ServiceConfig | null },
    contentType: ContentType & { contentTypeInfo?: ContentTypeInfo | null }
  ) => {
    if (contentType.source !== "builder.io") return <></>;
    const publicKey = extractBuilderPublicKey(service.serviceConfig);
    return (
      <BuilderComponent
        key={contentType.id}
        model={contentType.name}
        apiKey={publicKey}
      />
    );
  };

  const rows = serviceTree?.contentTypes
    ? Object.values(serviceTree.contentTypes).map((contentType) => {
        return {
          ...contentType,
          contents: Object.values(contentType.contents),
        };
      })
    : [];

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
      field: "source",
      headerName: "Source",
      flex: 1,
    },

    {
      field: "schema",
      headerName: "Schema",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return params.row.source === "builder.io" ? null : (
          <JsonForms
            schema={jsonParseWithFallback(
              extractSchema(params.row.contentTypeInfo)
            )}
            //uischema={uiSchema}
            data={jsonParseWithFallback(
              extractDefaultValues(params.row.contentTypeInfo)
            )}
            renderers={materialRenderers}
            cells={materialCells}
          />
        );
      },
    },
    {
      field: "preview",
      headerName: "Preview",
      flex: 4,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return params.row.source === "local" ? (
          <LiveProvider
            code={replacePropsInFunction({
              code: extractCode(params.row.contentTypeInfo),
              contents: [
                jsonParseWithFallback(
                  extractDefaultValues(params.row.contentTypeInfo)
                ),
              ],
            })}
            noInline={true}
          >
            <LivePreview />
          </LiveProvider>
        ) : (
          <>{renderBuilderPreview(service, params.row)}</>
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
                  deleteContentType({
                    serviceId: service.id,
                    id: params.row.id,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <br />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setContentType(params.row);
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
            checkboxSelection
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
        <ContentTypeModal
          key="contentTypeModal"
          service={service}
          initialData={contentType}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          setServiceTree={setServiceTree}
        />
      </div>
    </>
  );
}

export default ContentTypeTable;
