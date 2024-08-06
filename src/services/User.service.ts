import { UserRepository } from "../repositrory/user/user.repositroy";
import { isName, isPassword, isUsername, Password } from "../types/user.types";
import { md5 } from 'js-md5';
import { decodeUsernameWithSalt } from "../utility/decode";


export class UserService {

    constructor(
        private userRepo: UserRepository
    ) {
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

}



