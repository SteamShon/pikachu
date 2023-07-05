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

import type JobForm from "../../../components/form/job/jobForm";
import JobModal from "../../../components/form/job/jobModal";
import { api } from "../../../utils/api";
import type { toServiceTree } from "../../../utils/tree";
import { fromServiceTree } from "../../../utils/tree";

function JobTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service;
  serviceTree?: ReturnType<typeof toServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof toServiceTree> | undefined>
  >;
}) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const { jobIds } = router.query;
  const [job, setJob] = useState<
    Parameters<typeof JobForm>[0]["initialData"] | undefined
  >(undefined);

  const { mutate: deleteJob } = api.job.remove.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;
        const integrations = prev.integrations[deleted.integrationId];
        if (!integrations) return prev;
        delete integrations.jobs[deleted.id];
        return prev;
      });
      setModalOpen(false);
    },
  });

  const rows = serviceTree?.integrations
    ? Object.values(serviceTree.integrations).flatMap(({ jobs }) => {
        return Object.values(jobs);
      })
    : [];

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
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
                  deleteJob({
                    id: params.row.id,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setJob(params.row);
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
      setJob(undefined);
      setModalOpen(true);
    },
  });

  return (
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
          selectionModel={(jobIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            if (ids && Array.isArray(ids)) {
              router.query.customsetIds = ids.map((id) => String(id));
              router.push(router);
            }
          }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      {serviceTree && (
        <JobModal
          key="jobModal"
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          service={fromServiceTree(serviceTree)}
          initialData={job}
          setServiceTree={setServiceTree}
        />
      )}
    </div>
  );
}

export default JobTable;
