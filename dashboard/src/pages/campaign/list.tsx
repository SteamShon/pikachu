import { DataGrid } from "@mui/x-data-grid";
import type { Campaign } from "@prisma/client";
import { useEffect, useState } from "react";
import CampaignForm from "../../components/form/campaignForm";
import { api } from "../../utils/api";

function CampaignList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { data: fetchedCampaigns, isLoading } = api.campaign.getAll.useQuery();

  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
    { field: "description", headerName: "Description" },
    { field: "status", headerName: "Status" },
  ];

  const rows = (campaigns || []).map((campaign) => {
    return campaign;
  });
  return (
    <>
      {modalOpen && (
        <CampaignForm
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          setCampaigns={setCampaigns}
        />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-violet-500 p-2 text-sm text-white transition hover:bg-violet-600"
        >
          Add Campaign
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

export default CampaignList;
