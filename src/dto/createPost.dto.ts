import { z } from 'zod'

interface userCreatePostData {
    images: string[]
    caption: string
    mentionsUsernames: string[]
    closeFriendOnly: boolean
}

const customBoolean = z.preprocess((val) => {
    if (typeof val === 'string') {
        return val.toLowerCase() === 'true'
    }
    return val
}, z.boolean())

export const createPostDto = z.object({
    images: z.array(z.string()),
    caption: z.string(),
    mentionsUsernames: z.string(),
    closeFriendOnly: customBoolean,
})

export type CreatePostDto = z.infer<typeof createPostDto>
