import { z } from "zod";
import { Name, Password, Email, zodUsername, zodPassword, zodEmail, zodName } from "../types/user.types";


const customBoolean = z.preprocess((val) => {
    if (typeof val === 'string') {
        return val.toLowerCase() === 'true'
    }
    return val
}, z.boolean())

interface updateUser {
    firstName: Name;
    lastName: Name;
    password: Password;
    email: Email;
    private: boolean;
    imageUrl?: string;
    bio?: string;
}

export const updateUserDto = z.object({
    firstName: zodName.optional(),
    lastName: zodName.optional(),
    email: zodEmail.optional(),
    password: zodPassword.optional(),
    private: customBoolean,
    bio: z.string().optional(),
    imageUrl: z.string().optional(),
});



export type UpdateUserDto = z.infer<typeof updateUserDto>;