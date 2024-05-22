import { createCookie } from "@remix-run/cloudflare";
import { env } from "./env.server";

export const sessionCookie = createCookie("session", {
	httpOnly: true,
	path: "/",
	sameSite: "lax",
	secure: env.NODE_ENV === "production",
});

export const passkeyAuthenticationChallengeCookie = createCookie(
	"passkeyAuthenticationChallenge",
	{
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
	}
);
