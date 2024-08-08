import { sha256 } from "js-sha256";
import { Email, Username } from "../types/user.types";

const salt  = sha256("f1nd1ngn3m0");

export const decodeUsernameWithSalt = (encodedUsername: string): string => {
    const saltedUsername = Buffer.from(encodedUsername, 'base64url').toString();
    return saltedUsername.slice(salt.length);
}

export const encodeIdentifierWithSalt = (identifier: Username): string => {
    const saltedIdentifier = salt + identifier;
    return Buffer.from(saltedIdentifier).toString('base64url');
}