import Box from "@mui/material/Box";
import { searchTokens } from "@/lib/users/user-list";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function HighlightMatch({ text, query }: { text: string; query: string }) {
  const tokens = searchTokens(query).sort((left, right) => right.length - left.length);
  if (tokens.length === 0) {
    return text;
  }
  const pattern = tokens.map(escapeRegExp).join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "ig"));
  const terms = new Set(tokens.map((token) => token.toLowerCase()));
  return parts.map((part, index) =>
    terms.has(part.toLowerCase()) ? (
      <Box key={index} component="mark" sx={{ color: "#0B75E1", backgroundColor: "transparent", fontWeight: 700 }}>
        {part}
      </Box>
    ) : (
      part
    ),
  );
}
