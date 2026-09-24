"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { customersCacheKey, useCustomersStore, type CustomersPage } from "@/lib/users/customers-store";
import { customerMatchesQuery, phoneDigits, searchTokens, type UserListItem } from "@/lib/users/user-list";

const statusColor = {
  ACTIVE: "success",
  OVERDUE: "warning",
  CANCELLED: "default",
} as const;

function StatusChip({ status }: { status: UserListItem["status"] }) {
  return <Chip size="small" label={status.charAt(0) + status.slice(1).toLowerCase()} color={statusColor[status]} />;
}

function HighlightPhone({ phone, query }: { phone: string; query: string }) {
  const tokens = searchTokens(query)
    .map(phoneDigits)
    .filter((digits) => digits.length > 0)
    .sort((left, right) => right.length - left.length);
  const matched = new Set<number>();
  const digits = phoneDigits(phone);
  for (const token of tokens) {
    let from = 0;
    while (from <= digits.length - token.length) {
      const at = digits.indexOf(token, from);
      if (at < 0) break;
      for (let index = at; index < at + token.length; index += 1) matched.add(index);
      from = at + 1;
    }
  }
  if (matched.size === 0) return phone;

  const parts: ReactNode[] = [];
  let plain = "";
  let marked = "";
  let digitIndex = 0;
  const flush = () => {
    if (plain) parts.push(plain);
    if (marked) {
      parts.push(
        <Box key={parts.length} component="mark" sx={{ color: "#0B75E1", backgroundColor: "transparent", fontWeight: 700 }}>
          {marked}
        </Box>,
      );
    }
    plain = "";
    marked = "";
  };
  for (const character of phone) {
    if (/\d/.test(character) && matched.has(digitIndex)) {
      if (plain) flush();
      marked += character;
      digitIndex += 1;
    } else {
      if (marked) flush();
      plain += character;
      if (/\d/.test(character)) digitIndex += 1;
    }
  }
  flush();
  return parts;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
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

export default function UsersTable() {
  const query = useCustomersStore((state) => state.query);
  const setQuery = useCustomersStore((state) => state.setQuery);
  const page = useCustomersStore((state) => state.page);
  const setPage = useCustomersStore((state) => state.setPage);
  const remember = useCustomersStore((state) => state.remember);
  const debounced = useDebouncedValue(query, 300);
  const [previousQuery, setPreviousQuery] = useState(debounced);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);

  if (debounced !== previousQuery) {
    setPreviousQuery(debounced);
    if (page !== 1) setPage(1);
  }

  const requestPage = debounced === previousQuery ? page : 1;
  const cached = useCustomersStore((state) => state.pages[customersCacheKey(debounced, requestPage)] ?? null);
  const shownRef = useRef<UserListItem[]>([]);
  const previewRef = useRef<UserListItem[] | null>(null);
  if (cached) {
    shownRef.current = cached.users;
    previewRef.current = null;
  } else if (debounced !== previousQuery) {
    previewRef.current = shownRef.current.filter((customer) => customerMatchesQuery(customer, debounced));
  }

  const users = cached?.users ?? previewRef.current ?? [];
  const total = cached?.total ?? users.length;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: debounced, page: String(requestPage) });
    setPending(true);
    fetch(`/api/users?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as CustomersPage & { error?: string };
        if (!response.ok) {
          throw new AuthRequestError(body.error ?? "Something went wrong");
        }
        remember(debounced, requestPage, {
          users: body.users,
          page: body.page,
          pageSize: body.pageSize,
          total: body.total,
          approximate: body.approximate,
        });
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
  }, [debounced, remember, requestPage]);

  return (
    <Stack spacing={2}>
      <TextField
        label="Search"
        placeholder="Name, email, phone, or membership ID"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {pending && users.length === 0 ? <Typography>Loading customers…</Typography> : null}
      {cached?.approximate && users.length > 0 ? (
        <Typography sx={{ color: "#717680" }}>Showing close matches.</Typography>
      ) : null}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E5E7EB", borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Membership ID</TableCell>
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
                    <HighlightMatch text={user.membershipId} query={debounced} />
                  </TableCell>
                  <TableCell>
                    <HighlightMatch text={user.email} query={debounced} />
                  </TableCell>
                  <TableCell>{user.phone ? <HighlightPhone phone={user.phone} query={debounced} /> : "—"}</TableCell>
                  <TableCell>
                    <StatusChip status={user.status} />
                  </TableCell>
                </TableRow>
              ))}
              {!pending && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No customers match that search.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
        {users.map((user) => (
          <Paper key={user.id} elevation={0} sx={{ px: 1.5, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
              <Typography sx={{ color: "#003264", fontWeight: 600, minWidth: 0 }}>
                <HighlightMatch text={user.firstName} query={debounced} /> <HighlightMatch text={user.lastName} query={debounced} />
              </Typography>
              <StatusChip status={user.status} />
            </Stack>
            <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>
              <HighlightMatch text={user.membershipId} query={debounced} />
            </Typography>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <Typography noWrap sx={{ minWidth: 0, fontSize: 14 }}>
                <HighlightMatch text={user.email} query={debounced} />
              </Typography>
              <Typography sx={{ flexShrink: 0, fontSize: 14, color: "#717680" }}>
                {user.phone ? <HighlightPhone phone={user.phone} query={debounced} /> : "No phone"}
              </Typography>
            </Stack>
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
