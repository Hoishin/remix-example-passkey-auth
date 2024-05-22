import { type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { createToken } from "../lib/token.server";
import { sessionCookie } from "../lib/cookies.server";
import { assertNoSession } from "../lib/session.server";

export const loader = async ({
	request,
	context: { prisma },
}: LoaderFunctionArgs) => {
	await assertNoSession(request, prisma);

	const token = new URL(request.url).searchParams.get("token");
	if (!token) {
		throw new Response("token is missing", { status: 400 });
	}

	const challenge = await prisma.emailRegistrationChallenges.findUnique({
		where: { token },
		select: { email: true },
	});
	if (!challenge) {
		throw new Response("token is invalid", { status: 400 });
	}

	await prisma.emailRegistrationChallenges.delete({ where: { token } });

	const sessionToken = await createToken();
	await prisma.users.create({
		data: {
			email: challenge.email,
			Session: { create: { token: sessionToken } },
		},
	});

	throw redirect("/", {
		headers: {
			"Set-Cookie": await sessionCookie.serialize(sessionToken),
		},
	});
};
