"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AuthRequestError } from "@/lib/auth/http-client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { UserListItem } from "@/lib/users/user-list";

type UsersResponse = {
  users: UserListItem[];
  page: number;
  pageSize: number;
  total: number;
};

const statusColor = {
  ACTIVE: "success",
  OVERDUE: "warning",
  CANCELLED: "default",
} as const;

function StatusChip({ status }: { status: UserListItem["status"] }) {
  return <Chip size="small" label={status.charAt(0) + status.slice(1).toLowerCase()} color={statusColor[status]} />;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) {
    return text;
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <Box key={index} component="mark" sx={{ color: "#0B75E1", backgroundColor: "transparent", fontWeight: 700 }}>
        {part}
      </Box>
    ) : (
      part
    ),
  );
}

export default function UsersTable() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const [page, setPage] = useState(1);
  const [previousQuery, setPreviousQuery] = useState(debounced);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);

  if (debounced !== previousQuery) {
    setPreviousQuery(debounced);
    setPage(1);
  }

  const requestPage = debounced === previousQuery ? page : 1;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: debounced, page: String(requestPage) });
    setPending(true);
    fetch(`/api/users?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as UsersResponse & { error?: string };
        if (!response.ok) {
          throw new AuthRequestError(body.error ?? "Something went wrong");
        }
        setData(body);
        setError("");
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof AuthRequestError ? caught.message : "Something went wrong");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPending(false);
        }
      });
    return () => controller.abort();
  }, [debounced, requestPage]);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <Stack spacing={2}>
      <TextField
        label="Search"
        placeholder="Name, email, or phone"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {pending && users.length === 0 ? <Typography>Loading customers…</Typography> : null}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E5E7EB", borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <HighlightMatch text={user.firstName} query={debounced} /> <HighlightMatch text={user.lastName} query={debounced} />
                  </TableCell>
                  <TableCell>
                    <HighlightMatch text={user.email} query={debounced} />
                  </TableCell>
                  <TableCell>{user.phone ? <HighlightMatch text={user.phone} query={debounced} /> : "—"}</TableCell>
                  <TableCell>
                    <StatusChip status={user.status} />
                  </TableCell>
                </TableRow>
              ))}
              {!pending && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No customers match that search.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
        {users.map((user) => (
          <Paper key={user.id} elevation={0} sx={{ p: 2, border: "1px solid #E5E7EB", borderRadius: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
              <Typography sx={{ color: "#003264", fontWeight: 600 }}>
                <HighlightMatch text={user.firstName} query={debounced} /> <HighlightMatch text={user.lastName} query={debounced} />
              </Typography>
              <StatusChip status={user.status} />
            </Stack>
            <Typography sx={{ mt: 0.5 }}>
              <HighlightMatch text={user.email} query={debounced} />
            </Typography>
            <Typography variant="body2">
              {user.phone ? <HighlightMatch text={user.phone} query={debounced} /> : "No phone"}
            </Typography>
          </Paper>
        ))}
        {!pending && users.length === 0 ? <Typography>No customers match that search.</Typography> : null}
      </Stack>
      <TablePagination
        component="div"
        count={total}
        page={Math.max(0, requestPage - 1)}
        onPageChange={(_event, nextPage) => setPage(nextPage + 1)}
        rowsPerPage={20}
        rowsPerPageOptions={[20]}
        onRowsPerPageChange={() => undefined}
        sx={{
          ".MuiTablePagination-toolbar": { px: { xs: 0, sm: 2 }, flexWrap: "wrap", justifyContent: "flex-end" },
          ".MuiTablePagination-selectLabel, .MuiTablePagination-input": { display: "none" },
        }}
      />
    </Stack>
  );
}
