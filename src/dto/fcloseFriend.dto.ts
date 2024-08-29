import { z } from "zod";
import { zodUsername } from "../types/user.types";


export const closeFriendDto = z.object({
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


export type CloseFriendDto = z.infer<typeof closeFriendDto>;