import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Service, ServiceConfig } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { LivePreview, LiveProvider } from "react-live";
import { replacePropsInFunction } from "../../../components/common/CodeTemplate";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type CreativeForm from "../../../components/form/creativeForm";
import CreativeModal from "../../../components/form/creativeModal";
import { api } from "../../../utils/api";
import { extractCode } from "../../../utils/contentTypeInfo";
import { jsonParseWithFallback } from "../../../utils/json";
import type { buildServiceTree } from "../../../utils/tree";
import { buildAdGroupTree } from "../../../utils/tree";
function CreativeTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service & {
    serviceConfig?: ServiceConfig;
  };
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { adGroupIds, creativeIds } = router.query;
  const [creative, setCreative] = useState<
    Parameters<typeof CreativeForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (adGroupIds || []) as string[];

  const { mutate: deleteCreative } = api.adGroup.removeCreative.useMutation({
    onSuccess(created) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        const adGroups =
          prev?.placements?.[created.campaign.placementId]?.campaigns?.[
            created.campaignId
          ]?.adGroups;
        if (!adGroups) return prev;
        adGroups[created.id] = buildAdGroupTree(created);
        return prev;
      });

      setModalOpen(false);
    },
  });

  const allAdGroups = Object.values(serviceTree?.placements || []).flatMap(
    ({ campaigns, ...placement }) => {
      return Object.values(campaigns).flatMap(({ adGroups, ...campaign }) => {
        return Object.values(adGroups).map(({ creatives, ...adGroup }) => {
          return {
            ...adGroup,
            campaign: {
              ...campaign,
              placement,
            },
            creatives,
          };
        });
      });
    }
  );

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
      field: "placement.name",
      headerName: "Placement",
      flex: 1,
      valueGetter: (params) => {
        return params.row.adGroup.campaign.placement.name;
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
              code: extractCode(content?.contentType?.contentTypeInfo),
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
            if (ids && Array.isArray(ids)) {
              router.query.creativeIds = ids.map((id) => String(id));
              router.push(router);
            }
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
        service={service}
        adGroups={adGroups}
        contents={contents}
        initialData={creative}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default CreativeTable;
