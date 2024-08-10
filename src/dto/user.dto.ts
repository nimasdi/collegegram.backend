import { z } from "zod";
import { zodEmail, zodPassword, zodUsername } from "../types/user.types";

const checkRequired = (data: any,fieldName:string) => {
    if (data[fieldName] === "undefined") {
        return false;
    }
    return true;
}

export const createUserDto = z.object({
    username : zodUsername,
    password : zodPassword,
    email: zodEmail
})
.refine(data => checkRequired(data,"email"), {
    message: "email is required",
    path: ['email'],
  })
.refine(data => checkRequired(data,"password"), {
    message: "password is required",
    path: ['password'],
  })
.refine(data => checkRequired(data,"username"), {
    message: "username is required",
    path: ['username'],
  });


export type CreateUserDto = z.infer<typeof createUserDto>;