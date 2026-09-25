import Button from "@mui/material/Button";

export const dialogFooterButton = { flex: "1 1 0", minWidth: 0 } as const;

export default function DialogCloseButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="outlined" onClick={onClick} disabled={disabled} sx={dialogFooterButton}>
      Close
    </Button>
  );
}
