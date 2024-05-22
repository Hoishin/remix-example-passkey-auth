import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createToken } from "../lib/token.server";
import { useActionData } from "@remix-run/react";
import { assertNoSession } from "../lib/session.server";

export const loader = async ({
	request,
	context: { prisma },
}: LoaderFunctionArgs) => {
	await assertNoSession(request, prisma);
	return json(null);
};

export default () => {
	const actionData = useActionData<typeof action>();

	if (actionData?.ok) {
		return <div>Please check your email</div>;
	}

	return (
		<form method="post">
			<label>
				Email
				<input name="email" type="email" autoComplete="email" />
			</label>
			<button type="submit">Sign up</button>
		</form>
	);
};

const actionSchema = zfd.formData({
	email: zfd.text(z.string().email()),
});

export const action = async ({
	request,
	context: {
		prisma,
		cloudflare: { env },
	},
}: ActionFunctionArgs) => {
	await assertNoSession(request, prisma);

	const data = actionSchema.parse(await request.formData());
	const token = await createToken();
	await prisma.emailRegistrationChallenges.create({
		data: { email: data.email, token },
	});
	const url = new URL("/sign-up/confirm", env.SERVER_ORIGIN);
	url.searchParams.set("token", token);
	console.log(url.href);
	return json({ ok: true });
};
