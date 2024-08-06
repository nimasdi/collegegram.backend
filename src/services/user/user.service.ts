import { UserRepository, createUser } from "../../repositrory/user/user.repositroy";



export class UserService {
    private userRepository: UserRepository;
  
    constructor(userRepository: UserRepository) {
      this.userRepository = userRepository;
    }

    async createUser(userData : createUser): Promise<void> {
      await this.userRepository.createUser(userData);
    }
}