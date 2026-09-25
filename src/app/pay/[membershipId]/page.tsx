import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { privateRobots } from "@/lib/seo";
import { publicPaymentDue } from "@/lib/users/user-service";

export const metadata: Metadata = {
  title: "Payment due",
  description: "A private AMP Memberships payment page.",
  robots: privateRobots,
  referrer: "no-referrer",
};

export default async function PayPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const due = await publicPaymentDue(membershipId);

  return (
    <Box component="main" id="main" sx={{ minHeight: "100dvh", px: 2, py: 6, background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)" }}>
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 480, mx: "auto" }}>
        <Typography component="h1" variant="h1">
          Payment due
        </Typography>
        {due ? (
          <Box sx={{ p: 2, border: "1px solid #E5E7EB", borderRadius: 3, backgroundColor: "#FDFDFD" }}>
            <Typography sx={{ color: "#717680" }}>{due.name}</Typography>
            <Typography sx={{ mt: 2 }}>{due.description}</Typography>
            <Stack direction="row" sx={{ mt: 2, pt: 2, borderTop: "1px solid #E5E7EB", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#003264", fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ color: "#003264", fontWeight: 700 }}>{due.amount}</Typography>
            </Stack>
          </Box>
        ) : (
          <Typography>Nothing is due on this membership.</Typography>
        )}
      </Stack>
    </Box>
  );
}
