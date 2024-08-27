import { z } from "zod";
import { zodUsername } from "../types/user.types";
import { checkRequired } from "./createUser.dto";


export const followRequestActionDto = z.object({
    sender: zodUsername,
    receiver: zodUsername,
    action: z.enum(['accepted', 'declined'])
}).refine(data => checkRequired(data, "sender"), {
    message: "sender is required",
    path: ['sender'],
}).refine(data => checkRequired(data, "receiver"), {
    message: "receiver is required",
    path: ['receiver'],
}).refine(data => checkRequired(data, "action"), {
    message: "action is required",
    path: ['action'],
});


export type FollowRequestActionDto = z.infer<typeof followRequestActionDto>;