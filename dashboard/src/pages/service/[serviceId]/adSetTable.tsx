import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";

import type AdSetForm from "../../../components/form/adSet/adSetForm";
import AdSetModal from "../../../components/form/adSet/adSetModal";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import { fromServiceTree } from "../../../utils/tree";

function AdSetTable({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof AdSetForm>[0]["service"];
  serviceTree?: ReturnType<typeof toServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { adSetIds } = router.query;
  const [adSet, setAdSet] = useState<
    Parameters<typeof AdSetForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (adSetIds || []) as string[];

  const { mutate: deleteAdSet } = api.adSet.remove.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        const placement = prev.placements[deleted.placementId];
        if (!placement) return prev;
        delete placement.adSets[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allAdSets = Object.values(serviceTree?.placements || {}).flatMap(
    ({ adSets }) => {
      return Object.values(adSets);
    }
  );

  const adSets =
    selectedIds.length === 0
      ? allAdSets
      : allAdSets.filter((adSet) => {
          return selectedIds.includes(adSet.id);
        });

  const rows = adSets;

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
                  deleteAdSet({
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
                setAdSet(params.row);
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
      setAdSet(undefined);
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
        {serviceTree && (
          <AdSetModal
            key="adSetModal"
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            service={fromServiceTree(serviceTree)}
            initialData={adSet}
            setServiceTree={setServiceTree}
          />
        )}
      </div>
    </>
  );
}

export default AdSetTable;
