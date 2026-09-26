export function customerNoticeTo(customerEmail: string, actorEmail: string) {
  const customer = customerEmail.trim();
  const sample = customer.toLowerCase().endsWith("@example.com");
  return { to: sample ? actorEmail.trim() : customer, sample };
}

export function customerNoticeFootnote(sample: boolean) {
  return sample
    ? "This membership uses a sample address, so this email was sent to the signed-in CSR."
    : "This email was sent to the member.";
}
