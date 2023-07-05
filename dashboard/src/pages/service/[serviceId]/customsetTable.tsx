import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Service } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type CustomsetForm from "../../../components/form/customset/customsetForm";

import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import { buildCustomsetsTree } from "../../../utils/tree";
import CustomsetModal from "../../../components/form/customset/customsetModal";

function CustomsetTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service;
  serviceTree?: ReturnType<typeof toServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const { customsetIds } = router.query;
  const [customset, setCustomset] = useState<
    Parameters<typeof CustomsetForm>[0]["initialData"] | undefined
  >(undefined);

  const { mutate: deleteCustomset } = api.customset.remove.useMutation({
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
          disableSelectionOnClick
          experimentalFeatures={{ newEditingApi: true }}
          selectionModel={(customsetIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            if (ids && Array.isArray(ids)) {
              router.query.customsetIds = ids.map((id) => String(id));
              router.push(router);
            }
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
