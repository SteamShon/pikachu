import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { PlacementGroup, Service } from "@prisma/client";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import PlacementGroupModal from "../../../components/form/placementGroupModal";
import { api } from "../../../utils/api";
import { buildServiceTree } from "../../../utils/tree";
function PlacementGroupTable({
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
  const { placementGroupIds } = router.query;

  const { mutate: deletePlacementGroup } =
    api.service.removePlacementGroup.useMutation({
      onSuccess(deleted) {
        setServiceTree(buildServiceTree(deleted));
        setModalOpen(false);
      },
    });

  const [placementGroup, setPlacementGroup] = useState<
    PlacementGroup | undefined
  >(undefined);

  const filtered = [service];
  const rows = serviceTree?.placementGroups
    ? Object.values(serviceTree.placementGroups)
    : [];

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID" },
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
                  deletePlacementGroup({
                    serviceId: service.id,
                    name: params.row.name,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setPlacementGroup(params.row);
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
      setPlacementGroup(undefined);
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
          selectionModel={(placementGroupIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            router.query.placementGroupIds = ids;
            router.push(router);
            console.log(ids);
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>

      <PlacementGroupModal
        key="placementGroupModal"
        services={[service]}
        modalOpen={modalOpen}
        initialData={placementGroup}
        setModalOpen={setModalOpen}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default PlacementGroupTable;
