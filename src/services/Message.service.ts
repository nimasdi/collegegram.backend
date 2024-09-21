import mongoose from 'mongoose'
import { Username } from '../types/user.types'
import { HttpError } from '../utility/error-handler'
import { BlockRepository } from '../repositrory/Block/block.repository'
import { MessageRepository, chatResponse, messageReponse } from '../repositrory/Message/message.repository'
import path from 'path'
import { UserRepository, dataUserResponse } from '../repositrory/user/user.repositroy'

export class MessageService {
    constructor(private  messageRepo: MessageRepository, private blockRepo: BlockRepository, private userRepo: UserRepository) {}

    private async chekUsers(sender: Username, receiver: Username): Promise<{senderUser:dataUserResponse,receiverUser:dataUserResponse}>{
        const senderUser = await this.userRepo.getUserByUsername(sender)
        const receiverUser = await this.userRepo.getUserByUsername(receiver)
        if(!senderUser || !receiverUser){
            throw new HttpError(400, 'users not found')
        }
        const blockedSender = await this.blockRepo.checkBlock(senderUser.username, receiverUser.username)
        if(blockedSender){
            throw new HttpError(400, 'you blocked this user')
        }
        const blockedReceiver = await this.blockRepo.checkBlock(senderUser.username, receiverUser.username)
        if(blockedReceiver){
            throw new HttpError(400, 'this user blocked you')
        }

        return {senderUser, receiverUser}
    }

    private async chekReciever(receiver: Username): Promise<dataUserResponse>{
        const receiverUser = await this.userRepo.getUserByUsername(receiver)
        if(!receiverUser){
            throw new HttpError(400, 'users not found')
        }
        
        return receiverUser
    }

    async createTextMessage(sender: Username, receiver: Username, content: string): Promise<mongoose.Types.ObjectId> {
        const {senderUser, receiverUser} = await this.chekUsers(sender,receiver)

        const messageId = await this.messageRepo.addNewMessage(senderUser.id, receiverUser.id, content, 'text')
        return messageId
    }

    async createImageMessage(sender: Username, receiver: Username, content: string): Promise<mongoose.Types.ObjectId> {
        const {senderUser, receiverUser} = await this.chekUsers(sender,receiver)

        const contentUrl = `${process.env.HOST}/images/messages/${path.basename(content)}`

        const messageId = await this.messageRepo.addNewMessage(senderUser.id, receiverUser.id, contentUrl, 'image')
        return messageId
    }

    async seenMessages(messageIds: mongoose.Types.ObjectId[], receiver: Username): Promise<void> {
        const receiverUser = await this.chekReciever(receiver)

        await this.messageRepo.seenMessages(messageIds, receiverUser.id)
    }

    async getMessages(sender:Username, receiver: Username,pageNumber:number,pageSize:number): Promise<messageReponse[]> {
        const receiverUser = await this.chekReciever(receiver)
        const senderUser = await this.chekReciever(sender)

        const messages = await this.messageRepo.getMessages(senderUser.id,receiverUser.id, pageNumber, pageSize)
        return messages
    }

    async getChatLists(receiver: Username): Promise<chatResponse[]> {
        const receiverUser = await this.chekReciever(receiver)

        const chats = await this.messageRepo.getChatLists(receiverUser.id)
        return chats
    }
}
