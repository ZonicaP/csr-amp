const nameLimit = 80;

const ownNameKeys = new Set(["name", "surname"]);
const accessKeys = new Set(["status", "roles"]);

export function parseOwnName(input: { name: unknown; surname: unknown }): { value: { name: string; surname: string; displayName: string } } | { error: string } {
  if (typeof input.name !== "string") return { error: "Enter a first name" };
  if (typeof input.surname !== "string") return { error: "Enter a surname" };
  const name = input.name.trim();
  const surname = input.surname.trim();
  if (name.length < 1 || name.length > nameLimit || /[\r\n]/.test(name)) return { error: "Enter a first name" };
  if (surname.length < 1 || surname.length > nameLimit || /[\r\n]/.test(surname)) return { error: "Enter a surname" };
  return { value: { name, surname, displayName: `${name} ${surname}` } };
}

export function readCsrPatch(actorId: string, csrId: string, body: Record<string, unknown>) {
  const keys = Object.keys(body);
  const editingName = keys.includes("name") || keys.includes("surname");
  if (editingName) {
    if (csrId !== actorId || keys.some((key) => !ownNameKeys.has(key))) {
      return { kind: "forbidden" as const, message: "You can change only your own name" };
    }
    const parsed = parseOwnName({ name: body.name, surname: body.surname });
    if ("error" in parsed) return { kind: "invalid" as const, message: parsed.error };
    return { kind: "own-name" as const, name: parsed.value.name, surname: parsed.value.surname };
  }
  if (keys.some((key) => !accessKeys.has(key))) {
    return { kind: "forbidden" as const, message: "You can change only your own name" };
  }
  return { kind: "access" as const };
}
