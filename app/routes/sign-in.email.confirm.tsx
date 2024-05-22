import { redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { assertNoSession } from "../lib/session.server";
import { createToken } from "../lib/token.server";
import { sessionCookie } from "../lib/cookies.server";

export const loader = async ({
	request,
	context: { prisma },
}: LoaderFunctionArgs) => {
	await assertNoSession(request, prisma);

	const token = new URL(request.url).searchParams.get("token");
	if (typeof token !== "string") {
		throw new Response("token is missing", { status: 400 });
	}

	const challenge = await prisma.emailAuthenticationChallenges.findUnique({
		where: { token },
		select: { userId: true },
	});
	if (!challenge) {
		throw new Response("token is invalid", { status: 400 });
	}

	await prisma.emailAuthenticationChallenges.delete({ where: { token } });

	const sessionToken = await createToken();
	await prisma.sessions.create({
		data: {
			userId: challenge.userId,
			token: sessionToken,
		},
	});

	throw redirect("/", {
		headers: {
			"Set-Cookie": await sessionCookie.serialize(sessionToken),
		},
	});
};
