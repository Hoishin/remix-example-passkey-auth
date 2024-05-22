import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { useActionData } from "@remix-run/react";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { assertNoSession } from "../lib/session.server";
import { createToken } from "../lib/token.server";

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
		return <div>Please follow the link in the email</div>;
	}

	return <div>Failed to sign in with email</div>;
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
	const user = await prisma.users.findUnique({
		where: { email: data.email },
		select: { id: true },
	});
	if (!user) {
		return json({ ok: true } as const);
	}

	await prisma.emailAuthenticationChallenges.create({
		data: { userId: user.id, token },
	});

	const url = new URL("/sign-in/email/confirm", env.SERVER_ORIGIN);
	url.searchParams.set("token", token);
	console.log(url.href);

	return json({ ok: true } as const);
};
