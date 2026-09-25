import Button from "@mui/material/Button";

export default function DialogCloseButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="text"
      onClick={onClick}
      disabled={disabled}
      sx={{ alignSelf: "flex-end", "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14, fontWeight: 600, color: "#717680" } }}
    >
      Close
    </Button>
  );
}
