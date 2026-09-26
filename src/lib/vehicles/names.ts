export function displayVehicleName(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .split(/([\s-])/)
    .map((part) => {
      if (part === " " || part === "-" || part.length === 0) return part;
      if (part.length <= 3) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function byClosestName(left: string, right: string) {
  return left.length - right.length || left.localeCompare(right);
}

export function matchVehicleNames(names: readonly string[], query: string, limit = 12) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [];
  const exact: string[] = [];
  const starts: string[] = [];
  const word: string[] = [];
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower === needle) exact.push(name);
    else if (lower.startsWith(needle)) starts.push(name);
    else if (lower.split(/[\s-]+/).some((part) => part.startsWith(needle))) word.push(name);
  }
  return [...exact.sort(byClosestName), ...starts.sort(byClosestName), ...word.sort(byClosestName)].slice(0, limit);
}
