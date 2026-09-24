import Link from "next/link";
import Box from "@mui/material/Box";
import BrandLink from "@/components/BrandLink";

export default function Navbar({ name }: { name: string }) {
  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: { xs: "flex", md: "none" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 2,
        pr: "max(16px, env(safe-area-inset-right))",
        pl: "max(16px, env(safe-area-inset-left))",
        pt: "max(8px, env(safe-area-inset-top))",
        pb: 1,
        minHeight: 64,
        backgroundColor: "#FDFDFD",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <BrandLink width={112} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5, minWidth: 0 }}>
        <Link
          href="/profile"
          style={{
            color: "#717680",
            fontSize: 14,
            fontWeight: 500,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}
        >
          {name}
        </Link>
      </Box>
    </Box>
  );
}
