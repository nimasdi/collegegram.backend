import { SearchHistoryRepository, searchHistory } from "../repositrory/SearchHistory/searchHistory.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";

export class SearchHistoryService {

    constructor(private searchRepo: SearchHistoryRepository, private userRepo: UserRepository) {
    }

    async create(username: Username, searchText: string): Promise<void> {
        const userExist = await this.userRepo.getUserByUsername(username)
        if (!userExist) {
            throw new HttpError(400, "user not found")
        }
        const existSearch = await this.searchRepo.checkSearchExist({username, searchText})
        if(existSearch) {
            return;
        }
        await this.searchRepo.createSearchHistory({username, searchText})
    }

    async getSearchListByUsername(username: Username): Promise<searchHistory[]> {
        const searchHistory = this.searchRepo.getSearchListByUsername(username)
        return searchHistory
    }
}



