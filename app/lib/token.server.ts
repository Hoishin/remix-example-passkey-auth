import { randomBytes } from "node:crypto";

export const createToken = async () => {
	return randomBytes(255).toString("base64url");
};
