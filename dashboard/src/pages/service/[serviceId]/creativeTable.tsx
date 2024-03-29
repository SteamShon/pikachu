import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import ContentPreview from "../../../components/builder/contentPreview";
import Stat from "../../../components/chart/Stat";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type CreativeForm from "../../../components/form/creative/creativeForm";

import { jsonParseWithFallback } from "../../../utils/json";
import type { toServiceTree } from "../../../utils/tree";
import { buildAdGroupTree } from "../../../utils/tree";
import CreativeModal from "../../../components/form/creative/creativeModal";
import { api } from "../../../utils/api";
function CreativeTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
  serviceTree?: ReturnType<typeof toServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { adGroupId } = router.query;
  const [creative, setCreative] = useState<
    Parameters<typeof CreativeForm>[0]["initialData"] | undefined
  >(undefined);

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

  const adGroups = adGroupId
    ? allAdGroups.filter((adGroup) => adGroup.id === adGroupId)
    : allAdGroups;

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
        if (content?.contentType?.type === "DISPLAY") {
          return (
            <ContentPreview
              service={service}
              contentType={content?.contentType}
              creatives={[
                {
                  id: params.row.id,
                  content: jsonParseWithFallback(content?.values),
                },
              ]}
              //contents={[jsonParseWithFallback(content?.values)]}
              showEditor={false}
            />
          );
        } else {
          return <></>;
        }
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
                  deleteCreative({
                    adGroupId: params.row.adGroupId,
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
                setCreative(params.row);
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
                    step: "contents",
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
                    step: "adGroups",
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
      setCreative(undefined);
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
            rowHeight={100}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 30, 40, 50]}
            disableSelectionOnClick
            experimentalFeatures={{ newEditingApi: true }}
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
      <div className="mt-4 items-center p-10">
        <Stat service={service} defaultGroupByKey="creative" />
      </div>
    </>
  );
}

export default CreativeTable;
