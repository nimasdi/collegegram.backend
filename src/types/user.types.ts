import { z } from 'zod'
import { Brand } from './Brand'
import mongoose from 'mongoose'
import { send } from 'process'

export type Int = Brand<number, 'Int'>
export const isInt = (x: number): x is Int => Number.isInteger(x)

export type NonZero = Brand<number, 'NonZero'>
export const isNonZero = (x: number): x is NonZero => x !== 0

export type Positive = Brand<number, 'Positive'>
export const isPositive = (x: number): x is Positive => x > 0

export type Natural = Int & NonZero & Positive
export const isNatural = (x: number) => isInt(x) && isNonZero(x) && isPositive(x)

// export type BoundedString<min extends number, max extends number> = Brand<string, `BoundedString<${min},${max}>`>
// export const isBoundedString =
//     <min extends number, max extends number>(min: number, max: number) =>
//     (x: string): x is BoundedString<min, max> =>
//         x.length >= min && x.length <= max
// export const zodBoundedString = <min extends number, max extends number>(min: number, max: number) => z.coerce.string().refine(isBoundedString(min, max), { message: `length should be between ${min} and ${max}` })

// type for firstname and lastname
export type Name = Brand<string, 'Name'>
export const isName = (x: string): x is Name => x.length >= 3 && x.length <= 50
export const zodName = z.coerce.string().refine(isName, { message: 'name length should be btween 3 and 50 char' })

// type for username
export type Username = Brand<string, 'Username'>
export const isUsername = (x: string): x is Username => x.length >= 5 && x.length <= 50
export const zodUsername = z.coerce.string().refine(isUsername, { message: 'username length should be btween 5 and 50 char' })

// type for password
export type Password = Brand<string, 'Password'>
export const isPassword = (x: string): x is Password => x.length >= 8 && x.length <= 50
export const zodPassword = z.coerce.string().refine(isPassword, { message: 'password length should be btween 8 and 50 char' })

// type for email
export type Email = Brand<string, 'Email'>
export const isEmail = (x: string): x is Email =>
    !!String(x)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
export const zodEmail = z.coerce.string().refine(isEmail, { message: 'email format is not correct' })

// Type for post id
export type PostId = Brand<string, 'PostId'>
export const isPostId = (x: string): x is PostId => mongoose.Types.ObjectId.isValid(x)
export const zodPostId = z.coerce.string().refine(isPostId, { message: 'Invalid post ID' })

// Type for comment ID
export type CommentId = Brand<string, 'CommentId'>
export const isCommentId = (x: string): x is CommentId => mongoose.Types.ObjectId.isValid(x)
export const zodCommentId = z.coerce.string().refine(isCommentId, { message: 'Invalid comment ID' })

// Type for mongo objectId
export type MongoId = Brand<string, 'MongoId'>
export const isMongoId = (x: string): x is MongoId => mongoose.Types.ObjectId.isValid(x)
export const zodMongoId = z.coerce.string().refine(isMongoId, { message: 'Invalid mongo ID' })

// Type for user ID
export type UserId = Brand<MongoId, 'UserId'>
export const isUserId = (x: string): x is UserId => mongoose.Types.ObjectId.isValid(x)
export const zodUserId = z.coerce.string().refine(isUserId, { message: 'Invalid user ID' })

export interface UserWithoutPosts {
    firstName: Name
    lastName: Name
    username: Username
    email: Email
    private: boolean
    imageUrl: string
    bio?: string
}
