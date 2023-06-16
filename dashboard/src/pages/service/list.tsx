import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import GridCustomToolbar from "../../components/common/GridCustomToolbar";
import Loading from "../../components/common/Loading";
import { api } from "../../utils/api";
import { useSession } from "next-auth/react";
import type ServiceForm from "../../components/form/service/serviceForm";
import ServiceModal from "../../components/form/service/serviceModal";

function ServiceList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [service, setService] =
    useState<Parameters<typeof ServiceForm>[0]["initialData"]>(undefined);
  const [services, setServices] = useState<
    NonNullable<Parameters<typeof ServiceForm>[0]["initialData"]>[]
  >([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { serviceIds } = router.query;

  // const { data: myServices } = api.usersOnServices.getAll.useQuery({
  //   userId: session?.user?.id,
  // });

  const { data: allServices, isLoading } =
    api.service.getAllOnlyServices.useQuery();

  const { mutate: deleteService } = api.service.remove.useMutation({
    onSuccess(deleted) {
      setServices((prev) =>
        prev.filter((service) => service.id !== deleted.id)
      );
      setModalOpen(false);
    },
  });

  useEffect(() => {
    if (allServices) setServices(allServices);
  }, [allServices]);

  const rows = services || [];
  const columns: GridColDef[] = [
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

  if (isLoading) return <Loading />;

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
          if (ids && Array.isArray(ids)) {
            router.query.serviceIds = ids.map((id) => String(id));
            router.push(router);
          }
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
