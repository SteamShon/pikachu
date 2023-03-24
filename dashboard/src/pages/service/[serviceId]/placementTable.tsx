import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
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
import { buildServiceTree } from "../../../utils/tree";
import RenderPreview from "./renderPreview";

function PlacementTable({
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
  const { placementIds } = router.query;
  const [placement, setPlacement] = useState<
    Parameters<typeof PlacementForm>[0]["initialData"] | undefined
  >(undefined);
  const selectedIds = (placementIds || []) as string[];

  const { mutate: deletePlacement } = api.service.removePlacement.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return undefined;
        return buildServiceTree(deleted);
      });
      setModalOpen(false);
    },
  });

  const allPlacements = serviceTree
    ? Object.values(serviceTree?.placements)
    : [];

  const placements =
    selectedIds.length === 0
      ? allPlacements
      : allPlacements.filter((placement) => {
          return selectedIds.includes(placement.id);
        });

  const contentTypes = serviceTree
    ? Object.values(serviceTree?.contentTypes)
    : [];

  const cubes = Object.values(serviceTree?.serviceConfig?.cubes || {});

  const rows = placements;

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      flex: 1,
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
          <div className="inline-block">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                  deletePlacement({
                    id: params.row.id,
                    serviceId: params.row.serviceId,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setPlacement(params.row);
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
      setPlacement(undefined);
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
            checkboxSelection
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
          cubes={cubes}
          initialData={placement}
          setServiceTree={setServiceTree}
        />
      </div>
      <div className="mt-4 items-center p-10">
        {service ? <RenderPreview serviceId={service.id} /> : null}
      </div>
    </>
  );
}

export default PlacementTable;
