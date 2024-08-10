import { Username } from "../types/user.types";

const salt = "static_salt_123";

export const encodeIdentifierWithSalt = (identifier: Username): string => {
    const saltedIdentifier = salt + identifier;

    const encoded = Buffer.from(saltedIdentifier, 'utf-8').toString('base64url');

    return encoded;
}

export const decodeUsernameWithSalt = (encodedUsername: string): string => {
    const saltedIdentifier = Buffer.from(encodedUsername, 'base64url').toString('utf-8');

    if (!saltedIdentifier.startsWith(salt)) {
        throw new Error("Invalid encoded username: Salt mismatch");
    }
    return saltedIdentifier.slice(salt.length);
}