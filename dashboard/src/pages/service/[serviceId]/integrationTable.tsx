import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SouthIcon from "@mui/icons-material/South";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Service } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type PlacementForm from "../../../components/form/placementForm";
import PlacementModal from "../../../components/form/placementModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import RenderPreview from "./renderPreview";
import IntegrationModal from "../../../components/form/integrationModal";
import type IntegrationForm from "../../../components/form/integrationForm";

function IntegrationTable({
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
  const { integrationIds } = router.query;
  const [integration, setIntegration] = useState<
    Parameters<typeof IntegrationForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (integrationIds || []) as string[];

  const allIntegrations = serviceTree
    ? Object.values(serviceTree?.placements).flatMap((placement) => {
        return Object.values(placement.integrations).map((integration) => {
          return { ...integration, placement: { ...placement } };
        });
      })
    : [];

  const integrations =
    selectedIds.length === 0
      ? allIntegrations
      : allIntegrations.filter((integration) => {
          return selectedIds.includes(integration.id);
        });

  const rows = integrations;

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
                console.log(e);
              }}
            >
              <DeleteIcon />
            </button>
            <button
              className="p-1 text-blue-400"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIntegration(params.row);
                setModalOpen(true);
              }}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="p-1 text-blue-400"
              onClick={(e) => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    step: "Campaigns",
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
      setIntegration(undefined);
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
        <IntegrationModal
          key="integrationModal"
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          service={service}
          setServiceTree={setServiceTree}
        />
      </div>
    </>
  );
}

export default IntegrationTable;
