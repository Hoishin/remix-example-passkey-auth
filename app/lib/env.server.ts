import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production"]),
	SERVER_ORIGIN: z.string().url(),
	RP_NAME: z.string(),
	RP_ID: z.string(),
});

export const env = envSchema.parse(process.env);
