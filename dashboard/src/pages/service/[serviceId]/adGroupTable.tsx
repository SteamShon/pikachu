import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Prisma } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type AdGroupForm from "../../../components/form/adGroupForm";
import AdGroupModal from "../../../components/form/adGroupModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildCampaignTree } from "../../../utils/tree";

function AdGroupTable({
  serviceTree,
  setServiceTree,
}: {
  serviceTree: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { campaignIds, adGroupIds } = router.query;
  const [adGroup, setAdGroup] = useState<
    Parameters<typeof AdGroupForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (campaignIds || []) as string[];

  const { mutate: deleteAdGroup } = api.campaign.removeAdGroup.useMutation({
    onSuccess(created) {
      setServiceTree((prev) => {
        if (!prev) return prev;

        const campaigns = prev?.placements?.[created.placementId]?.campaigns;
        if (!campaigns) return prev;

        campaigns[created.id] = buildCampaignTree(created);
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allCubes = Object.values(serviceTree.serviceConfig?.cubes || {}).map(
    ({ segments, ...cube }) => {
      return {
        ...cube,
        serviceConfig: {
          id: serviceTree.serviceConfig?.id || "",
          serviceId: serviceTree.id,
          s3Config: serviceTree?.serviceConfig?.s3Config as Prisma.JsonValue,
          builderConfig: serviceTree?.serviceConfig?.builderConfig || null,
          createdAt: serviceTree?.serviceConfig?.createdAt as Date,
          updatedAt: serviceTree?.serviceConfig?.updatedAt as Date,
        },
        segments,
      };
    }
  );
  const allCampaigns = Object.values(serviceTree?.placements || {}).flatMap(
    ({ campaigns, ...placement }) => {
      const cube = allCubes.find((cube) => cube.id === placement.cubeId);

      return Object.values(campaigns).map(({ adGroups, ...campaign }) => {
        return {
          ...campaign,
          adGroups,
          placement: {
            ...placement,
            cube,
          },
        };
      });
    }
  );

  const campaigns =
    selectedIds.length === 0
      ? allCampaigns
      : allCampaigns.filter((campaign) => {
          return selectedIds.includes(campaign.id);
        });

  const rows = campaigns.flatMap(({ adGroups, placement, ...campaign }) => {
    return Object.values(adGroups).map((adGroup) => {
      return { ...adGroup, campaign: { ...campaign, placement } };
    });
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
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
            if (ids && Array.isArray(ids)) {
              router.query.adGroupIds = ids.map((id) => String(id));
              router.push(router);
            }
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
        cubes={allCubes}
        initialData={adGroup}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default AdGroupTable;
