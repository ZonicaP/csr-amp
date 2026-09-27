export const startedCallStorageKey = "amp-started-call:v1";
export const startingCallStorageKey = "amp-starting-call:v1";

export type TransferNoticeCall = {
  reference: string;
  customer: { membershipId: string } | null;
};

export type TransferNotice = {
  message: string;
  href: string;
  action: "Open call";
};

type StorageReader = { getItem(key: string): string | null };
type StorageWriter = { setItem(key: string, value: string): void };
type StorageRemover = { removeItem(key: string): void };

export function readStartedCall(storage: StorageReader | null): string | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(startedCallStorageKey)?.trim() ?? "";
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writeStartedCall(storage: StorageWriter, reference: string) {
  try {
    storage.setItem(startedCallStorageKey, reference);
  } catch {
    return;
  }
}

export function clearStartedCall(storage: StorageRemover) {
  try {
    storage.removeItem(startedCallStorageKey);
  } catch {
    return;
  }
}

export function markCallStarting(storage: StorageWriter) {
  try {
    storage.setItem(startingCallStorageKey, "1");
  } catch {
    return;
  }
}

export function clearCallStarting(storage: StorageRemover) {
  try {
    storage.removeItem(startingCallStorageKey);
  } catch {
    return;
  }
}

export function isCallStarting(storage: StorageReader | null) {
  if (!storage) return false;
  try {
    return storage.getItem(startingCallStorageKey) === "1";
  } catch {
    return false;
  }
}

export function transferCallNotice(input: {
  call: TransferNoticeCall | null;
  fromName?: string | null;
  startedReference: string | null;
  dismissedReference: string | null;
  starting?: boolean;
}): TransferNotice | null {
  const call = input.call;
  if (!call || input.starting) return null;
  if (input.startedReference === call.reference) return null;
  if (input.dismissedReference === call.reference) return null;
  const fromName = input.fromName?.trim() ?? "";
  const membershipId = call.customer?.membershipId.trim() ?? "";
  return {
    message: fromName.length > 0 ? `${call.reference} was transferred to you from ${fromName}.` : `${call.reference} was transferred to you.`,
    href: membershipId.length > 0 ? `/customers/${membershipId}` : "/customers",
    action: "Open call",
  };
}
