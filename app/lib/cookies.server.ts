import { createCookie } from "@remix-run/cloudflare";

const isNodeJs =
	typeof globalThis.process !== "undefined" &&
	globalThis.process.release.name === "node";

export const sessionCookie = createCookie("session", {
	httpOnly: true,
	path: "/",
	sameSite: "lax",
	secure: !isNodeJs,
});

export const passkeyAuthenticationChallengeCookie = createCookie(
	"passkeyAuthenticationChallenge",
	{
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: !isNodeJs,
	}
);
