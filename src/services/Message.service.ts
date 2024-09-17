import mongoose, { Types, model } from 'mongoose'
import { UserId, Username, isUserId, isUsername } from '../types/user.types'
import { HttpError } from '../utility/error-handler'
import { BlockRepository } from '../repositrory/Block/block.repository'
import { MessageRepository, chatResponse, messageReponse } from '../repositrory/Message/message.repository'
import path from 'path'

type ActionType = 'like' | 'likePost' | 'comment' | 'follow' | 'followRequest'

export class NotificationService {
    constructor(private  messageRepo: MessageRepository, private blockRepo: BlockRepository) {}

    async createTextMessage(senderId: mongoose.Types.ObjectId, receiverId: mongoose.Types.ObjectId, content: string): Promise<void> {
        const blockedSender = await this.blockRepo.checkBlockById(senderId, receiverId)
        if(blockedSender){
            throw new HttpError(400, 'you blocked this user')
        }
        const blockedReceiver = await this.blockRepo.checkBlockById(receiverId, senderId)
        if(blockedReceiver){
            throw new HttpError(400, 'this user blocked you')
        }

        await this.messageRepo.addNewMessage(senderId, receiverId, content, 'text')
    }

    async createImageMessage(senderId: mongoose.Types.ObjectId, receiverId: mongoose.Types.ObjectId, content: string): Promise<void> {
        const blockedSender = await this.blockRepo.checkBlockById(senderId, receiverId)
        if(blockedSender){
            throw new HttpError(400, 'you blocked this user')
        }
        const blockedReceiver = await this.blockRepo.checkBlockById(receiverId, senderId)
        if(blockedReceiver){
            throw new HttpError(400, 'this user blocked you')
        }

        const contentUrl = `${process.env.HOST}/images/messages/${path.basename(content)}`

        await this.messageRepo.addNewMessage(senderId, receiverId, contentUrl, 'image')
    }

    async seenMessages(messageIds: mongoose.Types.ObjectId[], receiverId: mongoose.Types.ObjectId): Promise<void> {
        await this.messageRepo.seenMessages(messageIds, receiverId)
    }

    async getMessages(receiverId: mongoose.Types.ObjectId,pageNumber:number,pageSize:number): Promise<messageReponse[]> {
        const messages = await this.messageRepo.getMessages(receiverId, pageNumber, pageSize)
        return messages
    }

    async getChatLists(receiverId: mongoose.Types.ObjectId): Promise<chatResponse[]> {
        const chats = await this.messageRepo.getChatLists(receiverId)
        return chats
    }
}
