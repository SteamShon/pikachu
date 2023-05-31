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
import type IntegrationForm from "../../../components/form/integrationForm";
import IntegrationModal from "../../../components/form/integrationModal";
import type { buildServiceTree } from "../../../utils/tree";
import { api } from "../../../utils/api";

function IntegrationTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
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

  const { mutate: deleteIntegration } = api.integration.delete.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return undefined;
        delete prev.integrations[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allIntegrations = Object.values(serviceTree?.integrations || {});

  const integrations =
    selectedIds.length === 0
      ? allIntegrations
      : allIntegrations.filter((integration) => {
          return selectedIds.includes(integration.id);
        });

  const rows = integrations;

  const columns: GridColDef[] = [
    {
      field: "provide",
      headerName: "Provide",
      flex: 1,
      renderCell: (params) => {
        return params.row.provider.provide;
      },
    },
    {
      field: "provider",
      headerName: "Provider",
      flex: 1,
      renderCell: (params) => {
        return params.row.provider.name;
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
                  deleteIntegration({
                    id: params.row.id,
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
                setIntegration(params.row);
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
          initialData={integration}
          setServiceTree={setServiceTree}
        />
      </div>
    </>
  );
}

export default IntegrationTable;
