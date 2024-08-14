import { z } from "zod";

interface userUpdatePost{
    images: string[],
    caption: string,
    mentionsUsernames: string[]
}

export const updatePostDto = z.object({
    images : z.array(z.string()),
    caption: z.string(),
    mentionsUsernames: z.array(z.string())
})

export type UpdatePostDto = z.infer<typeof updatePostDto>;