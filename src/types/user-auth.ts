import { IUser } from '../db/user/user.model'
import { Brand } from './Brand'

export type LoggedInUser = Brand<IUser, 'LoggedInUser'>
