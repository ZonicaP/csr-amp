const csrStatus = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  INVALID: 400,
  UNAUTHENTICATED: 401,
} as const;

type CsrCode = keyof typeof csrStatus;

const genericMessage = "Something went wrong. Try again.";

export function mapApiError(error: unknown): { status: number; message: string; log: boolean } {
  if (isCsrError(error)) {
    const message = safeCsrMessage(error.message);
    return { status: csrStatus[error.code], message, log: message !== error.message };
  }
  if (brandOf(error) === "email-delivery") {
    return { status: 502, message: "The email could not be sent.", log: true };
  }
  if (brandOf(error) === "debug-unavailable") {
    return { status: 503, message: "Smart debug is unavailable. Try again.", log: true };
  }
  if (error instanceof SyntaxError) {
    return { status: 400, message: "The request could not be read.", log: false };
  }
  return { status: 500, message: genericMessage, log: true };
}

function isCsrError(error: unknown): error is { code: CsrCode; message: string } {
  if (brandOf(error) !== "csr" || !(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code in csrStatus;
}

function brandOf(error: unknown) {
  if (!(error instanceof Error)) return "";
  const brand = (error as { brand?: unknown }).brand;
  return typeof brand === "string" ? brand : "";
}

function safeCsrMessage(message: string) {
  if (message.length === 0 || message.length > 200 || looksSensitive(message)) return genericMessage;
  return message;
}

function looksSensitive(message: string) {
  return /:\/\/|passwordhash|authtoken|auth_secret|smtp_|inviteToken|resetToken|[\r\n]/i.test(message);
}
