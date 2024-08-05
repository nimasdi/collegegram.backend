import { UserRepository, createUser } from "../../repositrory/user/user.repositroy";



export class UserService {
    private userRepository: UserRepository;
  
    constructor(userRepository: UserRepository) {
      this.userRepository = userRepository;
    }

    async createUser(userData : createUser): Promise<Boolean> {
      const user = await this.userRepository.createUser(userData);
      return true
    }
}