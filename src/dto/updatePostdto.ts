import { z } from "zod";

interface userUpdatePost{
    images: string[],
    caption: string,
    mentionsUsernames: string[]
}

const customBoolean = z.preprocess((val) => {
    if (typeof val === 'string') {
        return val.toLowerCase() === 'true'
    }
    return val
}, z.boolean())

export const updatePostDto = z.object({
    images : z.array(z.string()),
    caption: z.string(),
    mentionsUsernames: z.array(z.string()),
    closeFriendOnly: customBoolean
})

export type UpdatePostDto = z.infer<typeof updatePostDto>;