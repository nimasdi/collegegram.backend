import { z } from "zod";
import { zodMongoId, zodUsername } from "../types/user.types";
import { checkRequired } from "./createUser.dto";


const ActionType = z.enum(["like", "comment", "followRequest" || 'followDeclined' || 'followAcepted' || 'mention']);
const TargetEntityType = z.enum(["postId", "commentId", "userId"]);


export const createNotificationDto = z.object({
    actionCreator: zodUsername,
    actionType: ActionType,
    targetEntityType: TargetEntityType,
    targetEntityId: zodMongoId,
    targetUser: zodUsername,
}).refine((data) => checkRequired(data, "actionCreator"), {
    message: "actionCreator is required",
    path: ["actionCreator"],
}).refine((data) => checkRequired(data, "actionType"), {
    message: "actionType is required",
    path: ["actionType"],
}).refine((data) => checkRequired(data, "targetEntityType"), {
    message: "targetEntityType is required",
    path: ["targetEntityType"],
}).refine((data) => checkRequired(data, "targetEntityId"), {
    message: "targetEntityId is required",
    path: ["targetEntityId"],
}).refine((data) => checkRequired(data, "targetUser"), {
    message: "targetUser is required",
    path: ["targetUser"],
});


export type CreateNotificationDto = z.infer<typeof createNotificationDto>;
