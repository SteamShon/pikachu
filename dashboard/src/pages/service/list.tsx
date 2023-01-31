import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Service } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import GridCustomToolbar from "../../components/common/GridCustomToolbar";
import ServiceModal from "../../components/form/serviceModal";
import { api } from "../../utils/api";

function ServiceList() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { serviceIds } = router.query;
  const { data: allServices } = api.service.getAllOnlyServices.useQuery();

  const { mutate: deleteService } = api.service.delete.useMutation({
    onSuccess(deleted) {
      setServices((prev) =>
        prev.filter((service) => service.id !== deleted.id)
      );
      setModalOpen(false);
    },
  });

  const [service, setService] = useState<Service | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (allServices) setServices(allServices);
  }, [allServices]);

  const rows = services || [];
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID" },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params) => {
        return (
          <Link href={`/service/${params.row.id}/dashboard`}>
            {params.row.name}
          </Link>
        );
      },
    },
    {
      field: "description",
      headerName: "Description",
      flex: 4,
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
    },
    {
      field: "updatedAt",
      headerName: "UpdatedAt",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => {
        return (
          <div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                deleteService({
                  id: params.row.id,
                });
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setService(params.row);
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
      setService(undefined);
      setModalOpen(true);
    },
  });
  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 30, 40, 50]}
        checkboxSelection
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
        selectionModel={(serviceIds || []) as string[]}
        onSelectionModelChange={(ids) => {
          router.query.serviceIds = ids;
          router.push(router);
          console.log(ids);
        }}
        components={{
          Toolbar: toolbar,
        }}
      />

      <ServiceModal
        key="serviceModal"
        modalOpen={modalOpen}
        initialData={service}
        setModalOpen={setModalOpen}
        setServices={setServices}
      />
    </Box>
  );
}

export default ServiceList;
