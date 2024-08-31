import { md5 } from "js-md5";
import { createUser, dataUserResponse, loginUser, loginUserResponse, updateUser, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isPassword, isUsername, Name, Password, PostId, Username, UserWithoutPosts } from "../types/user.types";
import { sign } from "jsonwebtoken";
import { decodeUsernameWithSalt, encodeIdentifierWithSalt } from "../utility/decode";
import { sendEmail } from "../utility/mailer";
import path from "path";
import { HttpError } from "../utility/error-handler";
import { UpdateUserDto } from "../dto/updateUser.dto";
import { PostRepository } from "../repositrory/post/post.repository";


export type userCreatePostData = {
    images: string[],
    caption: string,
    mentionsUsernames: string,
    closeFriendOnly: boolean
}

export type userUpdatePost = {
    images: string[],
    caption: string,
    mentionsUsernames: string,
    closeFriendOnly: boolean
}

type UsernameOrEmail = Username | Email;



const JWT_SECRET = process.env.JWT_SECRET as string;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;


if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export class UserService {

    constructor(private userRepo: UserRepository , private postRepo : PostRepository) {
    }

    async createUser(userData: createUser): Promise<Boolean> {
        userData.password = md5(userData.password) as Password;
        const userExist = await this.userRepo.checkUserExist(userData.email) || await this.userRepo.checkUserExist(userData.username)
        if (userExist) {
            throw new HttpError(400, "user exist before")
        }
        await this.userRepo.createUser(userData);
        return true
    }

    async LoginUser(usernameOrEmail: UsernameOrEmail, password: Password, rememberMe: boolean): Promise<string | null> {


        let user: loginUser | null = null;

        if (isUsername(usernameOrEmail)) {
            user = await this.userRepo.getUserPasswordByUsername(usernameOrEmail);
        } else if (isEmail(usernameOrEmail)) {
            user = await this.userRepo.getUserPasswordByEmail(usernameOrEmail);
        }

        if (user) {
            const hashedPasswordFromClient = md5(password);
            if (hashedPasswordFromClient === user.password) {
                const expiresIn = rememberMe ? '30d' : '1d';
                const token = sign({ username: user.username }, JWT_SECRET, { expiresIn });
                return token;
            }
            return null;
        }
        return null;
    }

    async updatePassword(encodedUsername: string, password: string) {

        const username = decodeUsernameWithSalt(encodedUsername);

        if (!isUsername(username)) {
            throw new Error("invalid username")
        }
        if (!isPassword(password)) {
            throw new Error("invalid password")
        }

        const hashedPassword = md5(password) as Password;

        const user = await this.userRepo.UpdatePassword(username, hashedPassword)

        return true;
    }

    async sendEmail(identifier: Username | Email): Promise<Boolean> {
        let user: loginUserResponse | null;
        if (isUsername(identifier)) {
            user = await this.userRepo.getUserByUsername(identifier)
        } else {
            user = await this.userRepo.getUserPasswordByEmail(identifier)
        }

        if (!user) {
            return false
        }

        const encodedIdentifier = encodeIdentifierWithSalt(user.username);
        const resetPassLink = `http://5.34.195.108/setPassword/${encodedIdentifier}`

        // Send a welcome email after successful registration
        await sendEmail(user.email, 'Reset Password', 'reset yout password', `<h1>${resetPassLink}</h1>`);
        return true
    };

    async GetUserInformation(username: Username): Promise< dataUserResponse & { count: number } | null> {
        const userId = await this.userRepo.getUserIdByUsername(username)
        if (userId == null) {
            throw new Error("user not found")
        }
        const posts = await this.postRepo.getAll(userId)
        const count = posts.length;
        const user = await this.userRepo.getUserByUsername(username);
        if(user){
            return { ...user, count };
        }
        return null;
    }


    async updateUserInformation(username: string, updatedData: UpdateUserDto, imageFile?: string): Promise<boolean> {

        if (!isUsername(username)) {
            throw new HttpError(400, "Invalid username");
        }

        const newData = {
            ...updatedData,
            imageUrl: ""
        }

        const email = updatedData.email
        if (email) {
            const userWithThisEmail = await this.userRepo.checkUserExist(email);
            const thisUser = await this.userRepo.checkUserExist(username);
            if (userWithThisEmail && userWithThisEmail != thisUser) {
                throw new HttpError(400, "this email already exists")
            }
            else {
                newData.email = email
            }
        }

        if (imageFile) {
            newData.imageUrl = `http://5.34.195.108:3000/images/profile/${path.basename(imageFile)}`
        }

        const password = updatedData.password
        if (password) {
            newData.password = md5(password) as Password;
        }

        const updatedUser = await this.userRepo.updateUser(username, newData);

        return updatedUser != null ? true : false;
    }

    async getUserInfoWithoutPosts(username: Username): Promise<UserWithoutPosts | null> {
        const user = await this.userRepo.getUserByUsername(username);

        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        const { ...userWithoutPosts } = user;

        return userWithoutPosts as UserWithoutPosts;
    }

}



