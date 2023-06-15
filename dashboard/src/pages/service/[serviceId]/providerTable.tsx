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
import type IntegrationForm from "../../../components/form/integration/integrationForm";

import type { buildServiceTree } from "../../../utils/tree";
import { api } from "../../../utils/api";
import ProviderModal from "../../../components/form/provider/providerModal";
import type ProviderForm from "../../../components/form/provider/providerForm";

function ProviderTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof ProviderForm>[0]["service"];
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { providerIds } = router.query;
  const [provider, setProvider] = useState<
    Parameters<typeof ProviderForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (providerIds || []) as string[];

  const { mutate: deleteIntegration } = api.provider.delete.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return undefined;
        delete prev.integrations[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allProviders = Object.values(serviceTree?.providers || {});

  const providers =
    selectedIds.length === 0
      ? allProviders
      : allProviders.filter((provider) => {
          return selectedIds.includes(provider.id);
        });

  const rows = providers;

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
                setProvider(params.row);
                setModalOpen(true);
              }}
            >
              <EditIcon />
            </button>
          </div>
        );
      },
    },
  ];
  const toolbar = GridCustomToolbar({
    label: "Create",
    onClick: () => {
      setProvider(undefined);
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
        <ProviderModal
          key="providerModal"
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          service={service}
          setServiceTree={setServiceTree}
          initialData={provider}
        />
      </div>
    </>
  );
}

export default ProviderTable;
