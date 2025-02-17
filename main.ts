import { makeApp } from './src/app'
import MongoDBConnection from './src/db/connection'
import { Post } from './src/db/post/post'
import { IUser, User } from './src/db/user/user.model'
import { CommentRepository } from './src/repositrory/comment/comment.repository'
import { PostRepository } from './src/repositrory/post/post.repository'
import { UserRepository } from './src/repositrory/user/user.repositroy'
import { UserService } from './src/services/User.service'
import { Comment } from './src/db/comment/comment'
import dotenv from 'dotenv'
import { CommentService } from './src/services/Comment.service'
import { LikeCommentRepository } from './src/repositrory/comment/likeComment.repository'
import { LikeComment } from './src/db/comment/likeComment'
import { FollowService } from './src/services/Follow.service'
import { FollowRepository } from './src/repositrory/Follow/follow.repository'
import { Follow } from './src/db/Follow/follow.model'
import { PostService } from './src/services/Post.service'
import { LikePostRepository } from './src/repositrory/post/likePost.repository'
import { LikePost } from './src/db/post/likePost'
import { SavePostRepository } from './src/repositrory/post/savePost.repository'
import { SavePost } from './src/db/post/savePost.model'
import { BlockRepository } from './src/repositrory/Block/block.repository'
import { Block } from './src/db/Block/block.model'
import { BlockService } from './src/services/Block.service'
import { CloseFriendService } from './src/services/CloseFriend.service'
import { CloseFriendRepository } from './src/repositrory/CloseFriend/closeFriend.repository'
import { NotificationtRepository } from './src/repositrory/notification/notification.repository'
import { Notification } from './src/db/notification/notification.model'
import { UserNotificationtRepository } from './src/repositrory/notification/userNotification.repository'
import { UserNotification } from './src/db/notification/userNotification.model'
import { NotificationService } from './src/services/Notification.service'
import { consumeFromQueue } from './src/rabbitMq/rabbit'
import { processNotificationMessage } from './src/rabbitMq/consume'
import { SearchHistoryRepository } from './src/repositrory/SearchHistory/searchHistory.repository'
import { SearchHistory } from './src/db/SearchHistory/searchHistory.model'
import { SearchHistoryService } from './src/services/HistorySearch.service'
import { MentionRepository } from './src/repositrory/post/mention.repository'
import { makeSocketApp } from './src/socket_app'
import { Username } from './src/types/user.types'
import { MessageService } from './src/services/Message.service'
import { MessageRepository } from './src/repositrory/Message/message.repository'
import { Message } from './src/db/Chat/message.model'

dotenv.config()

export const postRepo = new PostRepository(Post)
export const userRepo = new UserRepository(User)
const commentRepo = new CommentRepository(Comment)
const followRepo = new FollowRepository(Follow)
const notifRepo = new NotificationtRepository(Notification)
const userNotifRepo = new UserNotificationtRepository(UserNotification)
const closeFriendRepo = new CloseFriendRepository(Follow)
const blockRepo = new BlockRepository(Block)
const searchHistoryRepo = new SearchHistoryRepository(SearchHistory)
const mentionRepo = new MentionRepository(Post)
const messageRepo = new MessageRepository(Message)
const likeCommentRepo = new LikeCommentRepository(LikeComment)
const likePostRepo = new LikePostRepository(LikePost)
const savePostRepo = new SavePostRepository(SavePost)
const searchHistoryService = new SearchHistoryService(searchHistoryRepo, userRepo)
export const notifService = new NotificationService(userNotifRepo, notifRepo, userRepo, followRepo, blockRepo, closeFriendRepo)
const userService = new UserService(userRepo, postRepo, searchHistoryService)
const postService = new PostService(userRepo, notifService, postRepo, likePostRepo, savePostRepo, closeFriendRepo, followRepo, blockRepo, mentionRepo, searchHistoryService)
const commentService = new CommentService(userRepo, notifService, postRepo, commentRepo, likeCommentRepo, closeFriendRepo, followRepo, blockRepo)
const followService = new FollowService(followRepo, notifService, userRepo, blockRepo)
const messageService = new MessageService(messageRepo, blockRepo, userRepo)
const closeFriendService = new CloseFriendService(closeFriendRepo)
const blockService = new BlockService(blockRepo, userRepo, followRepo)

const uri = process.env.MONGO_URI || ''

const dbConnection = new MongoDBConnection(uri)

declare global {
    namespace Express {
        interface Request {
            user: IUser
        }
    }
}

declare module 'socket.io' {
    interface Socket {
        sessionID: string
        subject: Username
    }
}

dbConnection
    .connect()
    .then(async () => {
        // Start consuming messages
        consumeFromQueue('notification_queue', processNotificationMessage)

        const app = makeApp(userService, commentService, followService, postService, blockService, closeFriendService, notifService, searchHistoryService, messageService)

        const socketServer = makeSocketApp(app , messageService)

        const PORT = 8000
        const SOCKETPORT = 3030

        socketServer.listen(SOCKETPORT, () => {
            console.log(`Server is running on port ${SOCKETPORT}`)
        })

        app.listen(PORT, () => {
            console.log(`app run on port ${PORT}`)
        })
    })
    .catch((err) => console.log('not connected to db'))
