import Button from "@mui/material/Button";

export const dialogFooterButton = { flex: "1 1 0", minWidth: 0 } as const;

export default function DialogCloseButton({ onClick, disabled, grow = true, short = false }: { onClick: () => void; disabled?: boolean; grow?: boolean; short?: boolean }) {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={{
        ...(grow ? dialogFooterButton : { flex: "0 0 auto", alignSelf: "flex-end" }),
        ...(short ? { "&&": { minHeight: 36, py: "6px", fontSize: 14 } } : {}),
      }}
    >
      Close
    </Button>
  );
}
