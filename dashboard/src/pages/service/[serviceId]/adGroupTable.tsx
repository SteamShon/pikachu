import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { AdGroup, Service } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import AdGroupModal from "../../../components/form/adGroupModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildCampaignTree } from "../../../utils/tree";

function AdGroupTable({
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
  const { campaignIds, adGroupIds } = router.query;
  const [adGroup, setAdGroup] = useState<AdGroup | undefined>(undefined);
  const selectedIds = (campaignIds || []) as string[];

  const { mutate: deleteAdGroup } = api.campaign.removeAdGroup.useMutation({
    onSuccess(created) {
      setServiceTree((prev) => {
        if (!prev) return prev;

        const campaigns =
          prev.placementGroups[created?.placement?.placementGroup?.id || ""]
            ?.placements[created?.placement?.id || ""]?.campaigns;
        if (!campaigns) return prev;

        campaigns[created.id] = buildCampaignTree(created);
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allCampaigns = serviceTree
    ? Object.values(serviceTree.placementGroups).flatMap((placementGroup) => {
        const { placements, ...placementGroupData } = placementGroup;
        return Object.values(placements).flatMap((placement) => {
          const { campaigns, ...placementData } = placement;
          return Object.values(campaigns).map((campaign) => {
            const { adGroups, ...campaignData } = campaign;
            return {
              ...campaignData,
              placement: placementData,
              placementGroup: placementGroupData,
              adGroups,
            };
          });
        });
      })
    : [];

  const campaigns =
    selectedIds.length === 0
      ? allCampaigns
      : allCampaigns.filter((campaign) => {
          return selectedIds.includes(campaign.id);
        });

  const rows = campaigns.flatMap((campaign) => {
    const { adGroups, ...campaignData } = campaign;
    return Object.values(adGroups).map((adGroup) => {
      return { ...adGroup, campaign: campaignData };
    });
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },

    {
      field: "placementGroup.name",
      headerName: "PlacementGroup",
      flex: 1,
      valueGetter: (params) => {
        return params.row.campaign.placementGroup.name;
      },
    },
    {
      field: "placement.name",
      headerName: "Placement",
      flex: 1,
      valueGetter: (params) => {
        return params.row.campaign.placement.name;
      },
    },
    {
      field: "campaign.name",
      headerName: "Campaign",
      flex: 1,
      valueGetter: (params) => {
        return params.row.campaign.name;
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
      field: "filter",
      headerName: "Filter",
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
                  deleteAdGroup({
                    campaignId: params.row.campaignId,
                    name: params.row.name,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setAdGroup(params.row);
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
      setAdGroup(undefined);
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
          selectionModel={(adGroupIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            router.query.adGroupIds = ids;
            router.push(router);
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <AdGroupModal
        key="campaignModal"
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        campaigns={campaigns}
        initialData={adGroup}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default AdGroupTable;
