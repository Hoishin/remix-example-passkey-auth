import { redirect } from "@remix-run/react";
import { sessionCookie } from "./cookies.server";
import type { PrismaClient } from "@prisma/client";

export const getSessionUser = async (
	request: Request,
	prisma: PrismaClient
) => {
	const token = await sessionCookie.parse(request.headers.get("Cookie"));
	if (typeof token !== "string") {
		return null;
	}
	const session = await prisma.sessions.findUnique({
		where: { token },
		select: { User: { select: { id: true, email: true } } },
	});
	return session?.User;
};

export const assertSession = async (request: Request, prisma: PrismaClient) => {
	const user = await getSessionUser(request, prisma);
	if (!user) {
		throw redirect("/sign-in");
	}
	return user;
};

export const assertNoSession = async (
	request: Request,
	prisma: PrismaClient
) => {
	const user = await getSessionUser(request, prisma);
	if (user) {
		throw redirect("/");
	}
};
