import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Customset, CustomsetInfo, Service } from "@prisma/client";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import CustomsetModal from "../../../components/form/customsetModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildCustomsetsTree } from "../../../utils/tree";

function CustomsetTable({
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

  const [modalOpen, setModalOpen] = useState(false);
  const { customsetIds } = router.query;
  const [customset, setCustomset] = useState<
    (Customset & { customsetInfo: CustomsetInfo }) | undefined
  >(undefined);

  const { mutate: deleteCustomset } = api.service.removeCustomset.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;

        prev.customsets = buildCustomsetsTree(deleted.customsets);
        return prev;
      });
      setModalOpen(false);
    },
  });

  const rows = serviceTree?.customsets
    ? Object.values(serviceTree.customsets)
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
      flex: 4,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
    {
      field: "createdBy",
      headerName: "CreatedBy",
      flex: 1,
      valueGetter: (params) => {
        return params.row.createdBy.name;
      },
    },
    {
      field: "createdAt",
      headerName: "CreatedAt",
      flex: 1,
    },
    {
      field: "updatedAt",
      headerName: "UpdatedAt",
      flex: 1,
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
                  deleteCustomset({
                    serviceId: params.row.serviceId,
                    name: params.row.name,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setCustomset(params.row);
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
      setCustomset(undefined);
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
          selectionModel={(customsetIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            router.query.customsetIds = ids;
            router.push(router);
            console.log(ids);
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <CustomsetModal
        key="customsetModal"
        services={[service]}
        initialData={customset}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CustomsetTable;
