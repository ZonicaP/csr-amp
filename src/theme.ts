import { createTheme } from "@mui/material/styles";

const navy = "#003264";
const blue = "#0B75E1";
const body = "#717680";
const ink = "#181D27";
const white = "#FDFDFD";
const soft = "#F5FAFF";
const border = "#E5E7EB";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: blue, contrastText: "#FFFFFF" },
    secondary: { main: navy, contrastText: "#FFFFFF" },
    error: { main: "#FA4362" },
    warning: { main: "#FFA100" },
    success: { main: "#11B76B" },
    text: { primary: navy, secondary: body },
    background: { default: soft, paper: white },
    divider: border,
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    h1: { fontWeight: 300, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.02em", color: navy },
    body1: { fontSize: "1rem", lineHeight: 1.5, color: body },
    body2: { fontSize: "0.875rem", lineHeight: 1.45, color: body },
    button: { fontWeight: 600, textTransform: "none", fontSize: "1rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: soft, color: ink },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 40,
          padding: "14px 20px",
          minHeight: 48,
          boxShadow: "none",
          transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
        },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: {
          borderColor: border,
          backgroundColor: "#FFFFFF",
          color: blue,
          "&:hover": { borderColor: border, backgroundColor: soft, boxShadow: "none" },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: "#FFFFFF" },
        input: { fontSize: 16, padding: "14px 16px" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: {
          "&:not(.MuiInputLabel-shrink)": {
            transform: "translate(16px, 14px) scale(1)",
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: { root: { color: body } },
    },
  },
});

export default theme;
