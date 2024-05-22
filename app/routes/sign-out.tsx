import { type ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { sessionCookie } from "../lib/cookies.server";
import { assertSession } from "../lib/session.server";

export const action = async ({
	request,
	context: { prisma },
}: ActionFunctionArgs) => {
	await assertSession(request, prisma);

	throw redirect("/", {
		headers: {
			"Set-Cookie": await sessionCookie.serialize(null, { maxAge: 0 }),
		},
	});
};
