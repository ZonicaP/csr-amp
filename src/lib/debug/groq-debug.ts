import { createGroq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { z } from "zod";
import { accountIssue, type AccountSnapshot } from "@/lib/debug/account-issue";

const answerSchema = z.object({
  likelyIssue: z.string(),
  summary: z.string(),
  steps: z.array(z.string()).min(1).max(4),
});

export type DebugAnswer = z.infer<typeof answerSchema>;

export class DebugUnavailable extends Error {}

const system = `You help an AMP car-wash membership CSR debug one customer account.
Use only the account facts. Do not invent payments, plates, plans, dates, or actions this portal cannot do.
If the account is overdue, the outstanding payment is the most likely issue unless the CSR's question is clearly about something else. Even then, mention the outstanding payment.
The portal can email a payment link from the vehicle card when a charge has failed.
Write for a CSR on a call: short and concrete. Do not ask for a card number.
If the facts do not answer the question, say what is missing.
likelyIssue is one sentence for a status bar. summary is two or three sentences. steps are actions the CSR can take next.`;

export async function debugAccount(account: AccountSnapshot, question: string): Promise<DebugAnswer> {
  if (!process.env.GROQ_API_KEY) {
    throw new DebugUnavailable("Add GROQ_API_KEY to run Smart debug.");
  }
  const standing = accountIssue(account);
  const result = await generateText({
    model: createGroq({ apiKey: process.env.GROQ_API_KEY })("openai/gpt-oss-120b"),
    maxOutputTokens: 800,
    temperature: 0.2,
    providerOptions: {
      groq: {
        reasoningEffort: "low",
        reasoningFormat: "hidden",
        structuredOutputs: true,
      },
    },
    output: Output.object({ schema: answerSchema }),
    system,
    prompt: `Account standing: ${standing.headline}. ${standing.detail}

Account:
${JSON.stringify(account)}

CSR question:
${question}`,
  });
  if (!result.output) {
    throw new DebugUnavailable("Smart debug did not return an answer. Try again.");
  }
  return result.output;
}
