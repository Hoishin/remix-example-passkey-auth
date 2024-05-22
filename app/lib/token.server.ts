export const createToken = async () => {
	const arr = new Uint8Array(128);
	crypto.getRandomValues(arr);
	return Buffer.from(arr).toString("base64url");
};
