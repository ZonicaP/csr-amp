export function csrMatchesQuery(csr: { name: string; surname: string; email: string }, query: string) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) return true;
  const haystack = `${csr.name} ${csr.surname} ${csr.email}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}
