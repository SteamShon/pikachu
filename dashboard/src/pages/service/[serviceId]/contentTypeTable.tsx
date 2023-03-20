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
import type { Service } from "@prisma/client";
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
import { jsonParseWithFallback } from "../../../utils/json";
import type { buildServiceTree } from "../../../utils/tree";
import { buildContentTypesTree } from "../../../utils/tree";

function ContentTypeTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service;
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

  const rows = serviceTree?.contentTypes
    ? Object.values(serviceTree.contentTypes).map((contentType) => {
        return {
          ...contentType,
          contents: Object.values(contentType.contents),
        };
      })
    : [];

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
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
      field: "schema",
      headerName: "Schema",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => {
        return (
          <JsonForms
            schema={jsonParseWithFallback(params.row.schema)}
            //uischema={uiSchema}
            data={jsonParseWithFallback(params.row?.defaultValues)}
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
        return (
          <LiveProvider
            code={replacePropsInFunction({
              code: params.row?.uiSchema,
              contents: [jsonParseWithFallback(params.row?.defaultValues)],
            })}
            noInline={true}
          >
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
  );
}

export default ContentTypeTable;
