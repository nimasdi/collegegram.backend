import { z } from "zod";
import { zodUsername } from "../types/user.types";
import { checkRequired } from "./createUser.dto";


export const followRequestDto = z.object({
    sender : zodUsername,
    receiver: zodUsername
}).refine(data => checkRequired(data, "sender"), {
    message: "sender is required",
    path: ['sender'],
}).refine(data => checkRequired(data, "receiver"), {
    message: "receiver is required",
    path: ['receiver'],
});


export type FollowRequestDto = z.infer<typeof followRequestDto>;