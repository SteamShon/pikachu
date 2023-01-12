import EditIcon from "@mui/icons-material/Edit";
import { DataGrid } from "@mui/x-data-grid";
import type { Customset, CustomsetInfo, User } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CustomsetModal from "../../components/form/customsetModal";
import { api } from "../../utils/api";

function CustomsetList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [customsets, setCustomsets] = useState<
    (Customset & {
      customsetInfo: CustomsetInfo | null;
      createdBy: User;
    })[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: fetchedCustomsets, isLoading } =
    api.customset.getAll.useQuery();

  const { mutate: deleteCustomsets } = api.customset.deleteMany.useMutation({
    onSuccess(deletedCustomsets) {
      const deletedIds = deletedCustomsets.map((c) => c.id);
      setCustomsets((prev) =>
        prev.filter((customset) => !deletedIds.includes(customset.id))
      );

      setModalOpen(false);
    },
  });

  useEffect(() => {
    if (!isLoading && fetchedCustomsets) {
      setCustomsets(fetchedCustomsets);
    }
  }, [fetchedCustomsets, isLoading]);

  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
    { field: "description", headerName: "Description" },
    {
      field: "status",
      headerName: "Status",
    },
    {
      field: "creator",
      valueGetter: (params: unknown) => {
        return params.row.createdBy?.name;
      },
    },
    {
      field: "Edit",
      renderCell: (params: unknown) => (
        <Link href={`/customset/${params.row.id}/edit`}>
          <EditIcon />
        </Link>
      ),
    },
  ];

  const rows = (customsets || []).map((customset) => {
    return customset;
  });

  return (
    <>
      {modalOpen && (
        <CustomsetModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          setCustomsets={setCustomsets}
        />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-violet-500 p-2 text-sm text-white transition hover:bg-violet-600"
        >
          Add Customset
        </button>
        <button
          type="button"
          onClick={() => deleteCustomsets(selectedIds)}
          className="rounded-md bg-red-500 p-2 text-sm text-white transition hover:bg-red-600"
        >
          Delete Selected
        </button>
      </div>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20, 30]}
          checkboxSelection
          onSelectionModelChange={(newSelectionModel) => {
            setSelectedIds(newSelectionModel);
          }}
          selectionModel={selectedIds}
        />
      </div>
    </>
  );
}

export default CustomsetList;
