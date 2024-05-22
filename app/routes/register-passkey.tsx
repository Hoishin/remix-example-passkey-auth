import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { assertSession } from "../lib/session.server";
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { env } from "../lib/env.server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { startRegistration } from "@simplewebauthn/browser";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

export const loader = async ({
	request,
	context: { prisma },
}: LoaderFunctionArgs) => {
	const user = await assertSession(request, prisma);
	const existingPasskeys = await prisma.passkeys.findMany({
		where: { userId: user.id },
		select: { id: true, PasskeyTransports: { select: { transport: true } } },
	});
	const options = await generateRegistrationOptions({
		rpName: env.RP_NAME,
		rpID: env.RP_ID,
		userName: user.email,
		attestationType: "none",
		excludeCredentials: existingPasskeys.map((passkey) => ({
			id: passkey.id,
			transports: passkey.PasskeyTransports.map(
				(t) => t.transport
			) as AuthenticatorTransportFuture[],
		})),
	});
	await prisma.passkeyRegistrationChallenges.upsert({
		create: { userId: user.id, challenge: options.challenge },
		update: { challenge: options.challenge },
		where: { userId: user.id },
	});
	return json(options);
};

export default () => {
	const loaderData = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const actionData = useActionData<typeof action>();

	if (actionData?.ok) {
		return <div>Passkey registered</div>;
	}

	return (
		<button
			onClick={async () => {
				try {
					const result = await startRegistration(loaderData);
					submit(result as any, {
						method: "post",
						encType: "application/json",
					});
				} catch (error) {
					alert((error as Error).message);
				}
			}}
		>
			Register a passkey
		</button>
	);
};

export const action = async ({
	request,
	context: { prisma },
}: ActionFunctionArgs) => {
	const user = await assertSession(request, prisma);

	const body = (await request.json()) as RegistrationResponseJSON;

	const challenge = await prisma.passkeyRegistrationChallenges.findUnique({
		where: { userId: user.id },
		select: { challenge: true },
	});
	if (!challenge) {
		throw new Response("No registration challenge found", { status: 400 });
	}

	try {
		const verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: challenge.challenge,
			expectedOrigin: env.SERVER_ORIGIN,
			expectedRPID: env.RP_ID,
		});

		if (!verification.verified || !verification.registrationInfo) {
			throw new Response("Passkey verification failed", { status: 400 });
		}

		await prisma.passkeys.create({
			data: {
				id: verification.registrationInfo.credentialID,
				publicKey: Buffer.from(
					verification.registrationInfo.credentialPublicKey
				),
				counter: verification.registrationInfo.counter,
				deviceType: verification.registrationInfo.credentialDeviceType,
				backedUp: verification.registrationInfo.credentialBackedUp,
				PasskeyTransports: body.response.transports
					? {
							createMany: {
								data: body.response.transports.map((transport) => ({
									transport,
								})),
							},
					  }
					: undefined,
				userId: user.id,
			},
		});

		return json({ ok: true });
	} catch (error) {
		throw new Response(`Registration failed: ${(error as Error).message}`, {
			status: 400,
		});
	}
};
