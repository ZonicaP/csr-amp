import NextLink from "next/link";
import Link from "@mui/material/Link";

export default function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      component={NextLink}
      href={href}
      underline="hover"
      sx={{
        alignSelf: "flex-end",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        minHeight: 48,
        px: 0.5,
        textAlign: "right",
      }}
    >
      {children}
    </Link>
  );
}
