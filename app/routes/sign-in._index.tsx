import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { assertNoSession } from "../lib/session.server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { passkeyAuthenticationChallengeCookie } from "../lib/cookies.server";

export const loader = async ({
	request,
	context: {
		prisma,
		cloudflare: { env },
	},
}: LoaderFunctionArgs) => {
	await assertNoSession(request, prisma);
	const passkeyOptions = await generateAuthenticationOptions({
		rpID: env.RP_ID,
	});
	return json(
		{ passkeyOptions },
		{
			headers: {
				"Set-Cookie": await passkeyAuthenticationChallengeCookie.serialize(
					passkeyOptions.challenge
				),
			},
		}
	);
};

export default function SignInPage() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div>
			<form action="/sign-in/email" method="post">
				<label>
					Email
					<input name="email" type="email" autoComplete="email" />
				</label>
				<button type="submit">Sign in</button>
			</form>
			<button
				onClick={async () => {
					try {
						const result = await startAuthentication(data.passkeyOptions);
						submit(result as any, {
							action: "/sign-in/passkey",
							method: "post",
							encType: "application/json",
						});
					} catch (error) {
						alert((error as Error).message);
					}
				}}
			>
				Sign in with Passkey
			</button>
		</div>
	);
}
