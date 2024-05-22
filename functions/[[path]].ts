import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// @ts-expect-error
import * as build from "../build/server";

export const onRequest = createPagesFunctionHandler<Env>({
	build: build as any,
	getLoadContext: ({ context }) => {
		const DB = context.cloudflare.env.DB;
		const prisma = new PrismaClient({ adapter: new PrismaD1(DB) });
		return { prisma, cloudflare: context.cloudflare };
	},
});
