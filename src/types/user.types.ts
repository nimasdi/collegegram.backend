import { Brand } from './Brand';


// type for firstname and lastname
export type Name = Brand<string, 'Name'>;
export const isName = (x: string): x is Name =>
    x.length > 3 && x.length < 50 

// type for username
export type Username = Brand<string, 'Username'>;
export const isUsername = (x: string): x is Username =>
    x.length > 8 && x.length < 50 

// type for password
export type Password = Brand<string, 'Password'>;
export const isPassword = (x: string): x is Password =>
    x.length > 8 && x.length < 50 

// type for email
export type Email = Brand<string, 'Email'>;
export const isEmail = (x: string): x is Email =>
    !!String(x)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
