export class AuthRequestError extends Error {}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new AuthRequestError(data.error ?? "Something went wrong");
  }
  return data;
}

export async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new AuthRequestError(data.error ?? "Something went wrong");
  }
  return data;
}

export async function deleteJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "DELETE" });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new AuthRequestError(data.error ?? "Something went wrong");
  }
  return data;
}

export async function putJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new AuthRequestError(data.error ?? "Something went wrong");
  }
  return data;
}
