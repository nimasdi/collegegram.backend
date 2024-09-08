import mongoose, { Model, Types } from 'mongoose'
import { HttpError } from '../../utility/error-handler'
import { Username } from '../../types/user.types'
import { ISearchHistory } from '../../db/SearchHistory/searchHistory.model'

export interface searchHistory {
    username: Username,
    searchText: string
}
export class SearchHistoryRepository {
    private model: Model<ISearchHistory>

    constructor(model: Model<ISearchHistory>) {
        this.model = model
    }

    private handleDBError = (error: any) => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async createSearchHistory(searchHistoryData : searchHistory): Promise<void> {
        const notif = new this.model({ ...searchHistoryData })
        await notif.save().catch((err) => this.handleDBError(err))
    }

    async checkSearchExist(searchHistoryData : searchHistory): Promise<Boolean> {
        const search = await this.model.findOne({ ...searchHistoryData })
       
        return !!search
    }

    async getSearchListByUsername(username : Username): Promise<searchHistory[]> {
        const searchs = await this.model.find({ username })

        let searchResult: searchHistory[] = []
        if(searchs){
            for (const search of searchs) {
                searchResult.push({
                    username: search.username,
                    searchText: search.searchText
                })
            }
        }
       
        return searchResult
    }

}
