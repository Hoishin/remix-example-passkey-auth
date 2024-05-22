import { redirect, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { assertNoSession } from "../lib/session.server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import {
	passkeyAuthenticationChallengeCookie,
	sessionCookie,
} from "../lib/cookies.server";
import { env } from "../lib/env.server";
import type {
	AuthenticationResponseJSON,
	AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { createToken } from "../lib/token.server";

export const action = async ({
	request,
	context: { prisma },
}: ActionFunctionArgs) => {
	await assertNoSession(request, prisma);

	const challenge: string = await passkeyAuthenticationChallengeCookie.parse(
		request.headers.get("Cookie")
	);

	const body = (await request.json()) as AuthenticationResponseJSON;
	const passkey = await prisma.passkeys.findUnique({
		where: { id: body.id },
		select: {
			id: true,
			publicKey: true,
			counter: true,
			PasskeyTransports: { select: { transport: true } },
			User: { select: { id: true } },
		},
	});
	if (!passkey) {
		throw new Response("Passkey not found", { status: 400 });
	}

	const verification = await verifyAuthenticationResponse({
		response: body,
		expectedChallenge: challenge,
		expectedOrigin: env.SERVER_ORIGIN,
		expectedRPID: env.RP_ID,
		authenticator: {
			credentialID: passkey.id,
			credentialPublicKey: passkey.publicKey,
			counter: Number(passkey.counter),
			transports: passkey.PasskeyTransports.map(
				(t) => t.transport
			) as AuthenticatorTransportFuture[],
		},
	});

	if (!verification.verified) {
		throw new Response("Passkey verification failed", { status: 400 });
	}

	const sessionToken = await createToken();
	await prisma.sessions.create({
		data: {
			userId: passkey.User.id,
			token: sessionToken,
		},
	});

	throw redirect("/", {
		headers: {
			"Set-Cookie": await sessionCookie.serialize(sessionToken),
		},
	});
};
