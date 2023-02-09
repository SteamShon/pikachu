import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { Segment } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import GridCustomToolbar from "../../../../../../components/common/GridCustomToolbar";
import type SegmentForm from "../../../../../../components/form/segmentForm";
import SegmentModal from "../../../../../../components/form/segmentModal";
import { api } from "../../../../../../utils/api";

function SegmentTable() {
  const router = useRouter();
  const { cubeId } = router.query;
  const [modalOpen, setModalOpen] = useState(false);
  const [segment, setSegment] = useState<
    Parameters<typeof SegmentForm>[0]["initialData"] | undefined
  >(undefined);
  const [segments, setSegments] = useState<Segment[]>([]);

  const { data: cube } = api.cube.get.useQuery({
    id: (cubeId || "") as string,
  });

  useEffect(() => {
    setSegments(cube?.segments || []);
  }, [cube?.segments]);

  const { mutate: deleteSegement } = api.cube.removeSegment.useMutation({
    onSuccess(deleted) {
      setSegments(deleted.segments);
      setModalOpen(false);
    },
  });

  const rows = segments;
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
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
      field: "where",
      headerName: "Where",
      flex: 1,
    },
    {
      field: "population",
      headerName: "Population",
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
                  deleteSegement({
                    cubeId: params.row.cubeId,
                    id: params.row.id,
                  });
                }
              }}
              startIcon={<DeleteIcon />}
            ></Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSegment(params.row);
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
      setSegment(undefined);
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
          checkboxSelection
          disableSelectionOnClick
          experimentalFeatures={{ newEditingApi: true }}
          /*
          selectionModel={(adGroupIds || []) as string[]}
          onSelectionModelChange={(ids) => {
            if (ids && Array.isArray(ids)) {
              router.query.adGroupIds = ids.map((id) => String(id));
              router.push(router);
            }
          }}
          */
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>
      {cube ? (
        <SegmentModal
          key="segmentModal"
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          initialData={segment}
          cube={cube}
          setSegments={setSegments}
        />
      ) : null}
    </div>
  );
}

export default SegmentTable;
