import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getSessionUser } from "../lib/session.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({
	request,
	context: { prisma },
}: LoaderFunctionArgs) => {
	const user = await getSessionUser(request, prisma);
	return json({ user });
};

export default () => {
	const loaderData = useLoaderData<typeof loader>();

	if (loaderData.user) {
		return (
			<div>
				<div>Signed in as {loaderData.user.email}</div>
				<a href="register-passkey">Register a passkey</a>
				<form method="post" action="/sign-out">
					<button type="submit">Sign out</button>
				</form>
			</div>
		);
	}

	return (
		<div>
			<a href="/sign-up">Sign up</a>
			<a href="/sign-in">Sign in</a>
		</div>
	);
};
