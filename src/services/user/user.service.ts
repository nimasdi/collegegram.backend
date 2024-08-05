import { UserRepository, createUser } from "../../repositrory/user/user.repositroy";



export class UserService {
    private userRepository: UserRepository;
  
    constructor(userRepository: UserRepository) {
      this.userRepository = userRepository;
    }

    async createUser(userData : createUser): Promise<Boolean> {
      try {
        const user =  await this.userRepository.createUser(userData);
        if(!!user){
            return true
        }else{
            return false
        }
      } catch (error) {
        if(error instanceof Error){
          throw new Error(`Error creating form: ${error.message}`);
        }
      }
    }
}