import type { Customset } from "@prisma/client";
import { useEffect, useState } from "react";
import CustomsetModal from "../../components/form/customset";
import { api } from "../../utils/api";
// import { api } from "../../utils/api";

function CustomsetList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [customsets, setCustomsets] = useState<Customset[]>([]);
  const { data: fetchedCustomsets, isLoading } =
    api.customset.getAll.useQuery();

  useEffect(() => {
    if (!isLoading && fetchedCustomsets) {
      setCustomsets(fetchedCustomsets);
    }
  }, [fetchedCustomsets, isLoading]);

  return (
    <>
      {modalOpen && (
        <CustomsetModal
          setModalOpen={setModalOpen}
          setCustomsets={setCustomsets}
        />
      )}

      <div>
        <h2>{customsets?.length}</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-violet-500 p-2 text-sm text-white transition hover:bg-violet-600"
        >
          Add Customset
        </button>
      </div>
      {(customsets || []).map((customset) => {
        <div>{customset.name}</div>;
      })}
    </>
  );
}

export default CustomsetList;
