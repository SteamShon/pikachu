import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SouthIcon from "@mui/icons-material/South";
import NorthIcon from "@mui/icons-material/North";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type CampaignForm from "../../../components/form/campaign/campaignForm";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import { buildPlacementTree } from "../../../utils/tree";
import type { Service } from "@prisma/client";

import Stat from "../../../components/chart/Stat";
import CampaignModal from "../../../components/form/campaign/campaignModal";

function CampaignTable({
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
  const { placementId } = router.query;

  const [modalOpen, setModalOpen] = useState(false);
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
      flex: 1.5,
      renderCell: (params) => {
        return (
          <div className="flex">
            <button
              className="p-1 text-red-400"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                  deleteCampaign({
                    placementId: params.row.placementId,
                    name: params.row.name,
                  });
                }
              }}
            >
              <DeleteIcon />
            </button>
            <button
              className="p-1 text-blue-400"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCampaign(params.row);
                setModalOpen(true);
              }}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="p-1 text-blue-400"
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    step: "adGroups",
                    campaignId: params.row.id,
                  },
                });
              }}
            >
              <SouthIcon />
            </button>
            <button
              type="button"
              className="p-1 text-blue-400"
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    step: "placements",
                  },
                });
              }}
            >
              <NorthIcon />
            </button>
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
      <div className="mt-4 items-center p-10">
        <Stat service={service} defaultGroupByKey="campaign" />
      </div>
    </>
  );
}

export default CampaignTable;
