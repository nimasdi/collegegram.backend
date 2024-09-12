import { z } from 'zod'
import { Brand } from './Brand'

export type Username = Brand<string, 'Username'>

export namespace Username {
    const is = (x: string): x is Username => x.length >= 5 && x.length <= 50

    export const zod = z.coerce.string().refine(is, { message: 'username length should be btween 5 and 50 char' })
}
