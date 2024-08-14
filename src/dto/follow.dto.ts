import { z } from "zod";
import { zodUsername } from "../types/user.types";


export const followDto = z.object({
    followingUsername : zodUsername,
})
.refine(data => () => {
    if (!data) {
        return false;
    }
    return true;
  }, {
    message: "following is required",
    path: ['followingUsername'],
  })


export type FollowDto = z.infer<typeof followDto>;