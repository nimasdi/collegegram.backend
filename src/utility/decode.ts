import { sha256 } from "js-sha256";

const salt  = sha256("f1nd1ngn3m0");

export const decodeUsernameWithSalt = (encodedUsername: string): string => {
    const saltedUsername = Buffer.from(encodedUsername, 'base64url').toString();
    return saltedUsername.slice(salt.length);
}