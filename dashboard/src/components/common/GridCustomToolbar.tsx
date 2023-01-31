import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Button, Grid } from "@mui/material";
import type { GridSelectionModel } from "@mui/x-data-grid";
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";

type Props = {
  selectionModel: GridSelectionModel;
};

function GridCustomToolbar({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  // eslint-disable-next-line react/display-name
  return ({}: Props) => {
    // const [anchorElMenu, setAnchorElMenu] = useState<null | HTMLButtonElement>(
    //   null
    // );
    // const openMenu = Boolean(anchorElMenu);

    return (
      <GridToolbarContainer>
        <Grid container item xs>
          {/* default buttons */}
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />
          <GridToolbarExport />
          <GridToolbarQuickFilter />
        </Grid>

        <Grid>
          <Button
            variant="outlined"
            size="small"
            // disabled={!selectionModel || selectionModel.length === 0}
            startIcon={<AddCircleOutlineIcon />}
            onClick={onClick}
          >
            {label}
          </Button>
          {/* 
        <Menu
          id="menu-options"
          anchorEl={anchorElMenu}
          open={openMenu}
          onClose={() => {
            setAnchorElMenu(null);
          }}
        >
          <MenuItem /> //Clipped
          <MenuItem /> //Clipped
          <MenuItem /> //Clipped
        </Menu> */}
        </Grid>
      </GridToolbarContainer>
    );
  };
}

export default GridCustomToolbar;
