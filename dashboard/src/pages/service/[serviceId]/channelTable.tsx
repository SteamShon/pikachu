import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SouthIcon from "@mui/icons-material/South";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Placement, Service } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type ChannelForm from "../../../components/form/channelForm";
import ChannelModal from "../../../components/form/channelModal";
import { buildChannelTree, buildServiceTree } from "../../../utils/tree";
import { api } from "../../../utils/api";

function ChannelTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service & { placements: Placement[] };
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { channelIds } = router.query;
  const [channel, setChannel] = useState<
    Parameters<typeof ChannelForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (channelIds || []) as string[];

  const { mutate: deleteChannel } = api.service.removeChannel.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return undefined;
        prev.channels = buildChannelTree(deleted.channels);
        return prev;
      });
      setModalOpen(false);
    },
  });

  const allChannels = serviceTree ? Object.values(serviceTree?.channels) : [];

  const channels =
    selectedIds.length === 0
      ? allChannels
      : allChannels.filter((channel) => {
          return selectedIds.includes(channel.id);
        });

  const rows = channels;

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
                  deleteChannel({
                    serviceId: params.row.serviceId,
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
                setChannel(params.row);
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
      setChannel(undefined);
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
        <ChannelModal
          key="channelModal"
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          service={service}
          initialData={channel}
          setServiceTree={setServiceTree}
        />
      </div>
    </>
  );
}

export default ChannelTable;
