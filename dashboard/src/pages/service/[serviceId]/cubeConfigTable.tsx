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
import type CubeConfigForm from "../../../components/form/cubeConfigForm";
import CubeConfigModal from "../../../components/form/cubeConfigModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildCubeConfigsTree } from "../../../utils/tree";

function CubeConfigTable({
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
  const { cubeConfigIds } = router.query;
  const [cubeConfig, setCubeConfig] =
    useState<Parameters<typeof CubeConfigForm>[0]["initialData"]>(undefined);
  const selectedIds = (cubeConfigIds || []) as string[];

  const { mutate: deleteCubeConfig } =
    api.cubeConfig.removeCubeConfig.useMutation({
      onSuccess(deleted) {
        setServiceTree((prev) => {
          if (!prev) return undefined;

          prev.cubeConfigs = buildCubeConfigsTree(deleted.cubeConfigs);
          return prev;
        });
        setModalOpen(false);
      },
    });
  const allCubeConfigs = serviceTree
    ? Object.values(serviceTree.cubeConfigs)
    : [];

  const cubeConfigs =
    selectedIds.length === 0
      ? allCubeConfigs
      : allCubeConfigs.filter((cubeConfig) => {
          return selectedIds.includes(cubeConfig.id);
        });

  const rows = cubeConfigs;
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
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
                  deleteCubeConfig({
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
                setCubeConfig(params.row);
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
      setCubeConfig(undefined);
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
          selectionModel={(cubeConfigIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            if (ids && Array.isArray(ids)) {
              router.query.cubeConfigIds = ids.map((id) => String(id));
              router.push(router);
            }
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <CubeConfigModal
        key="cubeConfigModal"
        services={[service]}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        initialData={cubeConfig}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CubeConfigTable;
