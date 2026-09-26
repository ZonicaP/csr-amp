import type { SxProps, Theme } from "@mui/material/styles";

export function sheetDialogSx(maxWidth = 480): SxProps<Theme> {
  return {
    "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
    "& .MuiDialog-paper": {
      m: { xs: 0, md: 4 },
      width: { xs: "100%", md: "calc(100% - 64px)" },
      maxWidth: { xs: "100%", md: maxWidth },
      borderRadius: { xs: "16px 16px 0 0", md: 2 },
    },
  };
}
