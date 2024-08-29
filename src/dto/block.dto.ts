import { z } from "zod";
import { zodUsername } from "../types/user.types";


export const blockDto = z.object({
    blockingUsername : zodUsername,
})
.refine(data => () => {
    if (!data) {
        return false;
    }
    return true;
  }, {
    message: "blocking is required",
    path: ['blockingUsername'],
  })


export type BlockDto = z.infer<typeof blockDto>;