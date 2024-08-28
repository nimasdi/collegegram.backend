import {z} from 'zod'

interface userCreatePostData{
    images: string[],
    caption: string,
    mentionsUsernames: string[],
    closeFriendOnly: boolean
}

export const createPostDto = z.object({
    images : z.array(z.string()),
    caption: z.string(),
    mentionsUsernames: z.string(),
    closeFriendOnly: z.coerce.boolean()
})

export type CreatePostDto = z.infer<typeof createPostDto>;