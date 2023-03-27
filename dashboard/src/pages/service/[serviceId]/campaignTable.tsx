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
import type CampaignForm from "../../../components/form/campaignForm";
import CampaignModal from "../../../components/form/campaignModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildPlacementTree } from "../../../utils/tree";

function CampaignTable({
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
  const { placementId } = router.query;
  const [campaign, setCampaign] = useState<
    Parameters<typeof CampaignForm>[0]["initialData"] | undefined
  >(undefined);

  const { mutate: deleteCampaign } = api.placement.removeCampaign.useMutation({
    onSuccess(created) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        const placements = prev?.placements;
        if (!placements) return prev;
        placements[created.id] = buildPlacementTree(created);

        return prev;
      });

      setModalOpen(false);
    },
  });

  const allPlacements = serviceTree
    ? Object.values(serviceTree.placements).flatMap(
        ({ campaigns, ...placement }) => {
          return {
            ...placement,
            campaigns,
          };
        }
      )
    : [];

  const placements = placementId
    ? allPlacements.filter((placement) => placement.id === placementId)
    : allPlacements;

  const rows = placements.flatMap((placement) => {
    const { campaigns, ...placementData } = placement;
    return Object.values(campaigns).map((campaign) => {
      return { ...campaign, placement: placementData };
    });
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    {
      field: "placement.name",
      headerName: "Placement",
      flex: 1,
      valueGetter: (params) => {
        return params.row.placement.name;
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
      field: "type",
      headerName: "Type",
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
      field: "startedAt",
      headerName: "StartedAt",
      flex: 1,
      valueFormatter: (params) =>
        moment(params?.value).format("YYYY/MM/DD hh:mm A"),
    },
    {
      field: "endAt",
      headerName: "EndAt",
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
          <div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                  deleteCampaign({
                    placementId: params.row.placementId,
                    name: params.row.name,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setCampaign(params.row);
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
      setCampaign(undefined);
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
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <CampaignModal
        key="campaignModal"
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        placements={placements}
        initialData={campaign}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CampaignTable;
