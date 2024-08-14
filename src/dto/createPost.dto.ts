import {z} from 'zod'

interface userCreatePostData{
    images: string[],
    caption: string,
    mentionsUsernames: string[],
}

export const createPostDto = z.object({
    images : z.array(z.string()),
    caption: z.string(),
    mentionsUsernames: z.string()
})

export type CreatePostDto = z.infer<typeof createPostDto>;