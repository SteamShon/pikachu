import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type CubeForm from "../../../components/form/cubeForm";
import CubeModal from "../../../components/form/cubeModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";

function CubeTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof CubeForm>[0]["service"];
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const [cube, setCube] =
    useState<Parameters<typeof CubeForm>[0]["initialData"]>(undefined);

  const { mutate: deleteCube } = api.cube.remove.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        if (!prev.serviceConfig?.cubes) return prev;

        delete prev.serviceConfig?.cubes[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });
  const cubes = Object.values(serviceTree?.serviceConfig?.cubes || {}).map(
    (cube) => {
      return {
        ...cube,
        serviceConfig: { ...(serviceTree?.serviceConfig || {}) },
      };
    }
  );
  const rows = cubes;

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
        service={service}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        initialData={cube}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CubeTable;
