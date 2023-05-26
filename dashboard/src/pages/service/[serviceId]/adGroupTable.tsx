import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Prisma, Service } from "@prisma/client";
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
import Stat from "../../../components/chart/Stat";

function AdGroupTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service;
  serviceTree: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { placementId, campaignId } = router.query;
  const [adGroup, setAdGroup] = useState<
    Parameters<typeof AdGroupForm>[0]["initialData"] | undefined
  >(undefined);

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

  const allCubes = Object.values(serviceTree?.serviceConfig?.cubes || {}).map(
    (cube) => {
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
    campaignId || placementId
      ? allCampaigns.filter(
          (campaign) =>
            campaign.id === campaignId || campaign.placementId === placementId
        )
      : allCampaigns;

  const rows = campaigns.flatMap(({ adGroups, placement, ...campaign }) => {
    return Object.values(adGroups).map((adGroup) => {
      return { ...adGroup, campaign: { ...campaign, placement } };
    });
  });

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
      field: "filter",
      headerName: "Filter",
      flex: 4,
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
                  deleteAdGroup({
                    campaignId: params.row.campaignId,
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
                setAdGroup(params.row);
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
                    step: "creatives",
                    adGroupId: params.row.id,
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
                    step: "campaigns",
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
      setAdGroup(undefined);
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
      <div className="mt-4 items-center p-10">
        <Stat service={service} defaultGroupByKey="adGroup" />
      </div>
    </>
  );
}

export default AdGroupTable;
