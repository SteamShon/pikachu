import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type PlacementForm from "../../../components/form/placementForm";
import PlacementModal from "../../../components/form/placementModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildPlacementGroupTree } from "../../../utils/tree";

function PlacementTable({
  serviceTree,
  setServiceTree,
}: {
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { placementGroupIds, placementIds } = router.query;
  const [placement, setPlacement] = useState<
    Parameters<typeof PlacementForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (placementGroupIds || []) as string[];

  const { mutate: deletePlacement } =
    api.placementGroup.removePlacement.useMutation({
      onSuccess(deleted) {
        setServiceTree((prev) => {
          if (!prev) return undefined;

          prev.placementGroups[deleted.id] = buildPlacementGroupTree(deleted);
          return prev;
        });
        setModalOpen(false);
      },
    });
  const allPlacementGroups = serviceTree
    ? Object.values(serviceTree.placementGroups)
    : [];

  const placementGroups =
    selectedIds.length === 0
      ? allPlacementGroups
      : allPlacementGroups.filter((placementGroup) => {
          return selectedIds.includes(placementGroup.id);
        });

  const contentTypes = serviceTree
    ? Object.values(serviceTree?.contentTypes)
    : [];

  const rows = placementGroups.flatMap((placementGroup) => {
    const { placements, ...placementGroupData } = placementGroup;
    return Object.values(placements).map((placement) => {
      return { ...placement, placementGroup: placementGroupData };
    });
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "placementGroup.name",
      headerName: "PlacementGroup",
      flex: 1,
      valueGetter: (params) => {
        return params.row.placementGroup.name;
      },
    },
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
      field: "contentType.name",
      headerName: "ContentType",
      flex: 1,
      valueGetter: (params) => {
        return params.row.contentType.name;
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
                  deletePlacement({
                    placementGroupId: params.row.placementGroupId,
                    name: params.row.name,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setPlacement(params.row);
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
      setPlacement(undefined);
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
          selectionModel={(placementIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            if (ids && Array.isArray(ids)) {
              router.query.placementIds = ids.map((id) => String(id));
              router.push(router);
            }
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <PlacementModal
        key="placementModal"
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        placementGroups={placementGroups}
        contentTypes={contentTypes}
        initialData={placement}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default PlacementTable;
