import { z } from "zod";
import { createTerminalSchema } from "@moja/schemas";

// Re-export the shared schema as the base
// We can augment this in the future if frontend requires more strict rules
export const terminalFormSchema = createTerminalSchema;
export type TerminalFormValues = z.infer<typeof terminalFormSchema>;
