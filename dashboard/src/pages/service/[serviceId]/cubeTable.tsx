import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Service } from "@prisma/client";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type CubeForm from "../../../components/form/cubeForm";
import CubeModal from "../../../components/form/cubeModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildCubeConfigTree } from "../../../utils/tree";

function CubeTable({
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
  const [cube, setCube] =
    useState<Parameters<typeof CubeForm>[0]["initialData"]>(undefined);
  const selectedIds = (cubeConfigIds || []) as string[];

  const { mutate: deleteCube } = api.cubeConfig.removeCube.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return undefined;

        prev.cubeConfigs[deleted.id] = buildCubeConfigTree(deleted);
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

  const rows = cubeConfigs.flatMap((cubeConfig) => {
    return Object.values(cubeConfig.cubes);
  });

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
      field: "s3Path",
      headerName: "s3Path",
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
                  deleteCube({
                    cubeConfigId: params.row.cubeConfigId,
                    id: params.row.id,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setCube(params.row);
                setModalOpen(true);
              }}
              startIcon={<EditIcon />}
            ></Button>

            <Link
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
              aria-current="page"
              href={{
                pathname:
                  "/service/[serviceId]/[cubeConfigId]/[cubeId]/segment/segmentTable",
                query: {
                  serviceId: service.id,
                  cubeConfigId: params.row.cubeConfigId,
                  cubeId: params.row.id,
                },
              }}
            >
              Edit
            </Link>
          </div>
        );
      },
    },
  ];
  const toolbar = GridCustomToolbar({
    label: "Create",
    onClick: () => {
      setCube(undefined);
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
          // selectionModel={(cubeConfigIds || []) as string[]}
          // onSelectionModelChange={(ids) => {
          //   if (ids && Array.isArray(ids)) {
          //     router.query.cubeConfigIds = ids.map((id) => String(id));
          //     router.push(router);
          //   }
          // }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <CubeModal
        key="cubeConfigModal"
        cubeConfigs={cubeConfigs}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        initialData={cube}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CubeTable;
