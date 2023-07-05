import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SouthIcon from "@mui/icons-material/South";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type PlacementForm from "../../../components/form/placement/placementForm";
import { api } from "../../../utils/api";
import { toServiceTree } from "../../../utils/tree";

import type ContentPreview from "../../../components/builder/contentPreview";
import AdSetStat from "../../../components/chart/AdSetStat";
import PlacementModal from "../../../components/form/placement/placementModal";
import RenderPreview from "./renderPreview";

function PlacementTable({
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
  const { placementIds } = router.query;

  const [modalOpen, setModalOpen] = useState(false);
  const [placement, setPlacement] = useState<
    Parameters<typeof PlacementForm>[0]["initialData"] | undefined
  >(undefined);
  const [tabIndex, setTabIndex] = useState(0);

  const selectedIds = (placementIds || []) as string[];

  const { mutate: deletePlacement } = api.placement.remove.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return undefined;
        return toServiceTree(deleted);
      });
      setModalOpen(false);
    },
  });

  const allPlacements = Object.values(serviceTree?.placements || {}).map(
    ({ integrations, campaigns, ...placement }) => {
      return {
        ...placement,
        campaigns,
        integrations: Object.values(integrations),
      };
    }
  );

  const placements =
    selectedIds.length === 0
      ? allPlacements
      : allPlacements.filter((placement) => {
          return selectedIds.includes(placement.id);
        });

  const contentTypes = serviceTree
    ? Object.values(serviceTree?.contentTypes)
    : [];

  const integrations = Object.values(serviceTree?.integrations || {});

  const rows = placements;

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
    {
      field: "integrations",
      headerName: "Integrations",
      flex: 2,
      valueGetter: (params) => {
        return params.row.integrations?.length || 0;
      },
    },
    {
      field: "contentType.name",
      headerName: "ContentType",
      flex: 1,
      valueGetter: (params) => {
        return params.row.contentType?.name;
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
          <div className="flex">
            <button
              className="p-1 text-red-400"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                  deletePlacement({
                    id: params.row.id,
                    serviceId: params.row.serviceId,
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
                setPlacement(params.row);
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
                    step: "adSets",
                    placementId: params.row.id,
                  },
                });
              }}
            >
              <SouthIcon />
            </button>
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

  const tabs = [
    {
      label: "Stat",
      component: (
        <>
          {/* <Stat service={service} defaultGroupByKey="placement" /> */}
          <AdSetStat service={service} defaultGroupByKey="placement" />
        </>
      ),
    },
    {
      label: "Playground",
      component: <>{service && <RenderPreview service={service} />}</>,
    },
  ];
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
          service={service}
          contentTypes={contentTypes}
          integrations={integrations}
          initialData={placement}
          setServiceTree={setServiceTree}
        />
      </div>
      <br />
      <ul className="flex border-b border-gray-200 text-center">
        {tabs.map((tab, index) => {
          return (
            <li key={index} className="flex-1">
              <a
                className={`${
                  index === tabIndex
                    ? "border-e border-s relative block border-t border-gray-200 bg-white p-4 text-sm font-medium"
                    : "block bg-gray-100 p-4 text-sm font-medium text-gray-500 ring-1 ring-inset ring-white"
                }`}
                onClick={() => setTabIndex(index)}
              >
                {index === tabIndex && (
                  <span className="absolute inset-x-0 -bottom-px h-px w-full bg-white"></span>
                )}
                {tab.label}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 items-center p-10">{tabs[tabIndex]?.component}</div>
    </>
  );
}

export default PlacementTable;
