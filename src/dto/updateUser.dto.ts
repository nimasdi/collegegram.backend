import { z } from "zod";
import { Name, Password, Email, zodUsername, zodPassword, zodEmail, zodName } from "../types/user.types";


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
    private: z.coerce.boolean().optional(),
    bio: z.string().optional(),
    imageUrl: z.string().optional()
});



export type UpdateUserDto = z.infer<typeof updateUserDto>;