import { DataGrid } from "@mui/x-data-grid";
import type { Customset } from "@prisma/client";
import { useEffect, useState } from "react";
import CustomsetModal from "../../components/form/customset";
import { api } from "../../utils/api";
// import { api } from "../../utils/api";

function CustomsetList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [customsets, setCustomsets] = useState<any[]>([]);
  const { data: fetchedCustomsets, isLoading } =
    api.customset.getAll.useQuery();

  useEffect(() => {
    if (!isLoading && fetchedCustomsets) {
      console.log(fetchedCustomsets);
      setCustomsets(fetchedCustomsets);
    }
  }, [fetchedCustomsets, isLoading]);

  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
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
      </div>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
        />
      </div>
    </>
  );
}

export default CustomsetList;
