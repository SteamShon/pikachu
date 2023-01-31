import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Service, User, UsersOnServices } from "@prisma/client";
import { useEffect, useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import UsersOnServicesModal from "../../../components/form/usersOnServicesModal";
import { api } from "../../../utils/api";

function UsersOnServicesList() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: usersOnServicesList } = api.usersOnServices.getAll.useQuery();

  const [usersOnServices, setUsersOnServices] = useState<
    (UsersOnServices & { user: User; service: Service })[]
  >([]);
  const [usersOnService, setUsersOnService] = useState<
    UsersOnServices | undefined
  >(undefined);

  useEffect(() => {
    if (usersOnServicesList) setUsersOnServices(usersOnServicesList);
  }, [usersOnServicesList]);

  const { mutate: deleteUsersOnService } =
    api.usersOnServices.delete.useMutation({
      onSuccess(deleted) {
        setUsersOnServices((prev) =>
          prev.filter(
            (u) =>
              u.userId !== deleted.userId || u.serviceId !== deleted.serviceId
          )
        );
      },
    });

  const columns: GridColDef[] = [
    {
      field: "user",
      headerName: "User",
      flex: 2,
      valueGetter: (params) => {
        return params.row.user.name;
      },
    },
    {
      field: "service",
      headerName: "Service",
      flex: 2,
      valueGetter: (params) => {
        return params.row.service.name;
      },
    },
    { field: "role", headerName: "Role", flex: 1 },
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
                deleteUsersOnService({
                  userId: params.row.user.id,
                  serviceId: params.row.service.id,
                });
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                //TODO
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
      setUsersOnService(undefined);
      setModalOpen(true);
    },
  });

  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        getRowId={(row) => `${row.serviceId}-${row.userId}`}
        rows={usersOnServices}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 30, 40, 50]}
        checkboxSelection
        disableSelectionOnClick
        components={{
          Toolbar: toolbar,
        }}
      />

      <UsersOnServicesModal
        key="usersOnServices"
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        setUsersOnServices={setUsersOnServices}
      />
    </Box>
  );
}

export default UsersOnServicesList;
