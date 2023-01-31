import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Creative, Service } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { LivePreview, LiveProvider } from "react-live";
import { replacePropsInFunction } from "../../../components/common/CodeTemplate";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import CreativeModal from "../../../components/form/creativeModal";
import { api } from "../../../utils/api";
import { jsonParseWithFallback } from "../../../utils/json";
import type { buildServiceTree } from "../../../utils/tree";
import { buildAdGroupTree } from "../../../utils/tree";
function CreativeTable({
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
  const { adGroupIds, creativeIds } = router.query;
  const [creative, setCreative] = useState<Creative | undefined>(undefined);
  const selectedIds = (adGroupIds || []) as string[];

  const { mutate: deleteCreative } = api.adGroup.removeCreative.useMutation({
    onSuccess(created) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        const adGroups =
          prev.placementGroups[
            created?.campaign?.placement?.placementGroup?.id || ""
          ]?.placements[created?.campaign?.placement?.id || ""]?.campaigns[
            created?.campaign?.id || ""
          ]?.adGroups;

        if (!adGroups) return prev;
        adGroups[created.id] = buildAdGroupTree(created);
        return prev;
      });

      setModalOpen(false);
    },
  });

  const allAdGroups = serviceTree
    ? Object.values(serviceTree.placementGroups).flatMap((placementGroup) => {
        const { placements, ...placementGroupData } = placementGroup;
        return Object.values(placements).flatMap((placement) => {
          const { campaigns, ...placementData } = placement;
          return Object.values(campaigns).flatMap((campaign) => {
            const { adGroups, ...campaignData } = campaign;
            return Object.values(adGroups).map((adGroup) => {
              const { creatives, ...adGroupData } = adGroup;
              return {
                ...adGroupData,
                campaign: campaignData,
                placement: placementData,
                placementGroup: placementGroupData,
                creatives,
              };
            });
          });
        });
      })
    : [];

  const adGroups =
    selectedIds.length === 0
      ? allAdGroups
      : allAdGroups.filter((adGroup) => {
          return selectedIds.includes(adGroup.id);
        });

  const rows = adGroups.flatMap((adGroup) => {
    const { creatives, ...adGroupData } = adGroup;
    return Object.values(creatives).map((creative) => {
      return { ...creative, adGroup: adGroupData };
    });
  });

  const contents = serviceTree
    ? Object.values(serviceTree.contentTypes).flatMap((contentType) => {
        return Object.values(contentType.contents).map((content) => {
          return { ...content, contentType };
        });
      })
    : [];

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    {
      field: "placementGroup.name",
      headerName: "PlacementGroup",
      flex: 1,
      valueGetter: (params) => {
        return params.row.adGroup.placementGroup.name;
      },
    },
    {
      field: "placement.name",
      headerName: "Placement",
      flex: 1,
      valueGetter: (params) => {
        return params.row.adGroup.placement.name;
      },
    },
    {
      field: "campaign.name",
      headerName: "Campaign",
      flex: 1,
      valueGetter: (params) => {
        return params.row.adGroup.campaign.name;
      },
    },
    {
      field: "adGroup.name",
      headerName: "AdGroup",
      flex: 1,
      valueGetter: (params) => {
        return params.row.adGroup.name;
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
      field: "content",
      headerName: "Content",
      flex: 4,
      renderCell: (params: GridRenderCellParams<Date>) => {
        const content = contents.find(
          (content) => content.id === params.row.contentId
        );
        return (
          <LiveProvider
            code={replacePropsInFunction({
              code: content?.contentType?.uiSchema || undefined,
              contents: [jsonParseWithFallback(content?.values)],
            })}
            noInline={true}
          >
            <LivePreview />
          </LiveProvider>
        );
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
                  deleteCreative({
                    adGroupId: params.row.adGroupId,
                    name: params.row.name,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setCreative(params.row);
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
      setCreative(undefined);
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
          rowHeight={100}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 30, 40, 50]}
          checkboxSelection
          disableSelectionOnClick
          experimentalFeatures={{ newEditingApi: true }}
          selectionModel={(creativeIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            router.query.creativeIds = ids;
            router.push(router);
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      <CreativeModal
        key="campaignModal"
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        adGroups={adGroups}
        contents={contents}
        initialData={creative}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CreativeTable;
