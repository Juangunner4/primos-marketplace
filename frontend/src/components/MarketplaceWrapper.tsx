import { Box, Drawer, useMediaQuery, IconButton, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import FilterPanel from "./Filter";

export interface MarketplaceWrapperProps {
  readonly children: React.ReactNode;
}

export function MarketplaceWrapper({ children }: MarketplaceWrapperProps) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);

  return (
    <Box display="flex">
      {!mdUp && (
        <Toolbar>
          <IconButton onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      )}

      <Drawer
        variant={mdUp ? "permanent" : "temporary"}
        open={mdUp ? true : open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 280, top: { md: 80 } } }}
      >
        <FilterPanel open={mdUp ? true : open} onClose={() => setOpen(false)} />
      </Drawer>

      <Box component="main" flexGrow={1} p={2}>
        {children}
      </Box>
    </Box>
  );
}

export default MarketplaceWrapper;
