import { defineConfig } from "vite";
import * as remix from "@remix-run/dev";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export default defineConfig({
	plugins: [
		remix.cloudflareDevProxyVitePlugin<Env, never>({
			getLoadContext: ({ context }) => {
				const DB = context.cloudflare.env.DB;
				const prisma = new PrismaClient({ adapter: new PrismaD1(DB) });
				return { prisma, cloudflare: context.cloudflare };
			},
		}),
		remix.vitePlugin(),
	],
	clearScreen: false,
});
