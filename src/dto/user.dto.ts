import { z } from "zod";
import { zodEmail, zodPassword, zodUsername } from "../types/user.types";

export const createUserDto = z.object({
    username : zodUsername,
    password : zodPassword,
    email: zodEmail
});


export type CreateUserDto = z.infer<typeof createUserDto>;