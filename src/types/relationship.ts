import { z } from 'zod'
import { User } from './user'
import { LoggedInUser } from './user-auth'

export type Relationship = Relationship.Blocked | Relationship.Following | Relationship.NoConnection

export namespace Relationship {
    export interface Following {
        _tag: 'Following'
        loggedInUser: LoggedInUser
        user: User
        status: Following.Status
    }

    export namespace Following {
        export type Status = (typeof Status.all)[number]
        export namespace Status {
            export const all = ['pending', 'accepted', 'declined'] as const
            export const zod = z.enum(all)
            export const Enum = zod.Enum
        }

        export interface Pending extends Following {
            status: 'pending'
        }

        export const isPending = (r: Following): r is Pending => r.status === 'pending'

        export interface Declined extends Following {
            status: 'declined'
        }

        export const isDeclined = (r: Following): r is Declined => r.status === 'declined'
    }

    export interface NoConnection {
        _tag: 'NoConnection'
        loggedInUser: LoggedInUser
        user: User
    }

    export interface Blocked {
        _tag: 'Blocked'
        loggedInUser: LoggedInUser
        user: User
        status: Blocked.Status
    }

    export namespace Blocked {
        export type Status = 'blockedByLoggedInUser' | 'blockedByUser' | 'bothBlocked'

        export interface ByTheUser {
            status: 'blockedByUser'
        }
    }
}
