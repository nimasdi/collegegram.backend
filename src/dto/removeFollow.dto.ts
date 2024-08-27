import { z } from "zod";
import { zodUsername } from "../types/user.types";


export const removeFollowerDto = z.object({
    followerUsername : zodUsername,
})
.refine(data => () => {
    if (!data) {
        return false;
    }
    return true;
  }, {
    message: "follower is required",
    path: ['followerUsername'],
  })


export type FollowerUsername = z.infer<typeof removeFollowerDto>;