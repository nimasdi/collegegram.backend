import { z } from 'zod'
import { Username } from '../types/username'

export const followRequestDto = z.object({
    receiver: Username.zod,
})

export type FollowRequestDto = z.infer<typeof followRequestDto>
