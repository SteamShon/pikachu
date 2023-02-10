import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import GridCustomToolbar from "../../../components/common/GridCustomToolbar";
import type SegmentForm from "../../../components/form/segmentForm";
import SegmentModal from "../../../components/form/segmentModal";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildCubeTree } from "../../../utils/tree";
function SegmentTable({
  serviceTree,
  setServiceTree,
}: {
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [segment, setSegment] =
    useState<Parameters<typeof SegmentForm>[0]["initialData"]>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const { cubeIds } = router.query;
  const selectedIds = (cubeIds || []) as string[];

  const { mutate: deleteSegment } = api.cube.removeSegment.useMutation({
    onSuccess(deleted) {
      setServiceTree((prev) => {
        if (!prev) return prev;

        const cubeConfig = prev.cubeConfigs[deleted.cubeConfigId];
        if (!cubeConfig) return prev;
        cubeConfig.cubes[deleted.id] = buildCubeTree(deleted);

        return prev;
      });
      setModalOpen(false);
    },
  });

  const allCubes = serviceTree?.cubeConfigs
    ? Object.values(serviceTree.cubeConfigs).flatMap(
        ({ cubes, ...cubeConfig }) => {
          return Object.values(cubes).flatMap(({ segments, ...cube }) => {
            return { ...cube, segments: Object.values(segments), cubeConfig };
          });
        }
      )
    : [];

  const cubes =
    selectedIds.length === 0
      ? allCubes
      : allCubes.filter((cube) => {
          return selectedIds.includes(cube.id);
        });

  const rows = cubes.flatMap(({ segments, cubeConfig, ...cube }) => {
    return segments.map((segment) => {
      return {
        ...segment,
        cube: {
          ...cube,
          cubeConfig,
        },
      };
    });
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    {
      field: "cubeConfig.name",
      headerName: "CubeConfig",
      flex: 1,
      valueGetter: (params) => {
        return params.row.cube.cubeConfig.name;
      },
    },
    {
      field: "cube.name",
      headerName: "Cube",
      flex: 1,
      valueGetter: (params) => {
        return params.row.cube.name;
      },
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
                  deleteSegment({
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
          // selectionModel={(cubeIds || []) as string[]}
          // onSelectionModelChange={(ids) => {
          //   if (ids && Array.isArray(ids)) {
          //     router.query.placementGroupIds = ids.map((id) => String(id));
          //     router.push(router);
          //   }
          // }}
          components={{
            Toolbar: toolbar,
          }}
        />
      </div>

      <SegmentModal
        key="segmentModal"
        cubes={cubes}
        modalOpen={modalOpen}
        initialData={segment}
        setModalOpen={setModalOpen}
        setServiceTree={setServiceTree}
      />
    </div>
  );
}

export default SegmentTable;
