"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0B75E1",
    },
    text: {
      primary: "#003264",
      secondary: "#717680",
    },
    background: {
      default: "#FDFDFD",
    },
  },
  typography: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
  },
});

export default theme;
