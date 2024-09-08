import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';

// Interface
export interface ISearchHistory extends Document {
    username: Username,
    searchText: Username,
}

// Search History Schema
const SearchHistorySchema: Schema<ISearchHistory> = new Schema({
    username: {
        type: String,
        ref: 'User',
        required: true,
    },
    searchText: {
        type: String,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// SearchHistory Model
export const SearchHistory: Model<ISearchHistory> = mongoose.model<ISearchHistory>('searchHistory', SearchHistorySchema);

