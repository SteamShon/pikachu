import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type IntegrationForm from "../../../components/form/integration/integrationForm";

import type SegmentForm from "../../../components/form/segment/segmentForm";
import SegmentModal from "../../../components/form/segment/segmentModal";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";

function SegmentTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  serviceTree?: ReturnType<typeof toServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { segmentIds } = router.query;
  const [segment, setSegment] = useState<
    Parameters<typeof SegmentForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (segmentIds || []) as string[];

  const { mutate: deleteSegment } = api.segment.remove.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        const integration = prev.integrations[deleted.integrationId];
        if (!integration) return prev;
        delete integration.segments[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allSegments = Object.values(serviceTree?.integrations || {}).flatMap(
    ({ segments, ...integration }) => {
      return Object.values(segments).map((segment) => {
        return { ...segment, integration };
      });
    }
  );

  const segments =
    selectedIds.length === 0
      ? allSegments
      : allSegments.filter((segment) => {
          return selectedIds.includes(segment.id);
        });

  const rows = segments;

  const columns: GridColDef[] = [
    {
      field: "integration",
      headerName: "Integration",
      flex: 1,
      renderCell: (params) => {
        return params.row.integration.name;
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
                  deleteSegment({
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
                setSegment(params.row);
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
      setSegment(undefined);
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
        <SegmentModal
          key="segmentModal"
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          service={service}
          initialData={segment}
          setServiceTree={setServiceTree}
        />
      </div>
    </>
  );
}

export default SegmentTable;
