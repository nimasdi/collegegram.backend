import { Email, Name, UserId, Username } from './user.types'

export interface User {
    id: UserId
    firstName: Name
    lastName: Name
    username: Username
    email: Email
    private: boolean
}
