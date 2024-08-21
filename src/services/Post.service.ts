import path from "path";
import { createPost, PostRepository, PostResponse, updatePost } from "../repositrory/post/post.repository"
import { UserRepository } from "../repositrory/user/user.repositroy"
import { isUsername, PostId, Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { extractTags } from "../utility/extractTags";
import { userCreatePostData, userUpdatePost } from "./User.service";
import { convertToArray } from "../utility/convertToArray";
import fs from 'fs';
import { likePostDto, unlikePostDto } from "../dto/likepPost.dto";
import { LikePostRepository } from "../repositrory/post/likePost.repository";


export class PostService {

    constructor(private userRepo: UserRepository, private postRepo: PostRepository , private likePostRepo : LikePostRepository) {
    }


    async createPost(username: string, postData: userCreatePostData): Promise<boolean> {
        if (!isUsername(username)) {
            throw new HttpError(400, "Invalid username");
        }

        const user = await this.userRepo.getUserByUsername(username);

        if (!user) {
            throw new HttpError(400, "User not found");
        }

        // Check and save images
        if (!postData.images || postData.images.length === 0) {
            throw new HttpError(400, "You haven't uploaded any images");
        }

        const imageUrls = postData.images.map(image => {
            return `http://5.34.195.108:3000/images/post/${path.basename(image)}`;
        });

        const mentionsUsernames = convertToArray(postData.mentionsUsernames)

        // Validate mentions
        const mentions: Username[] = [];
        if (mentionsUsernames && mentionsUsernames.length > 0) {
            for (const mentionedUsername of mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new HttpError(400, `Invalid username: ${mentionedUsername}`);
                }

                // Check if the username exists in the database
                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername);
                if (!mentionedUser) {
                    throw new HttpError(400, `User not found: ${mentionedUsername}`);
                }

                mentions.push(mentionedUsername);
            }
        }

        // Extract tags from caption
        const tags = extractTags(postData.caption);

        const postData2: Omit<createPost, 'createdAt'> = {
            ...postData,
            tags,
            images: imageUrls,
            mentions,
        };

        const userId = await this.userRepo.getUserIdByUsername(username);

        if (!userId) {
            throw new HttpError(500, "User ID not found");
        }


        const createdPost = await this.postRepo.createPost(postData2, userId);

        if (createdPost) {
            return true;
        }


        return false;
    }

    async updatePost(username: string, postId: string, postData: userUpdatePost) {
        if (!isUsername(username)) {
            throw new HttpError(400, "Invalid username");
        }

        const user = await this.userRepo.getUserByUsername(username);
        if (!user) {
            throw new HttpError(400, "User not found");
        }

        const post = await this.postRepo.findById(postId);
        if (!post) {
            throw new HttpError(400, "Post not found");
        }

        // Delete old images
        if (post.images && post.images.length > 0) {
            for (const oldImagePath of post.images) {
                const absolutePath = path.join(__dirname, '..', oldImagePath);
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                }
            }
        }

        let imageUrls: string[] = [];
        if (postData.images && postData.images.length > 0) {
            imageUrls = postData.images.map(image => {
                return `http://5.34.195.108:3000/images/post/${path.basename(image)}`;
            });
        } else {
            throw new HttpError(400, "You can't have a post without any images");
        }

        const mentionsUsernames = convertToArray(postData.mentionsUsernames);

        // Validate and process mentions
        const mentions: Username[] = [];
        if (mentionsUsernames && mentionsUsernames.length > 0) {
            for (const mentionedUsername of mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new HttpError(400, `Invalid username: ${mentionedUsername}`);
                }

                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername);
                if (!mentionedUser) {
                    throw new HttpError(400, `User not found: ${mentionedUsername}`);
                }

                mentions.push(mentionedUsername);
            }
        }

        // Extract tags from caption
        const tags = extractTags(postData.caption);

        const updateData: updatePost = {
            images: imageUrls,
            caption: postData.caption,
            tags,
            mentions,
        };


        const result = await this.postRepo.updatePost(postId, updateData);
        if (!result) {
            throw new HttpError(400, 'Failed to update the post');
        }

        return true;
    }

    async getPostById(postId: PostId): Promise<PostResponse> {
        const post = await this.postRepo.findById(postId)
        if (!post) {
            throw new HttpError(404, "post not found.")
        }
        return post
    }


    async getUserPosts(username: Username): Promise<PostResponse[]> {

        const userId = await this.userRepo.getUserIdByUsername(username)
        if (!userId)
            throw new HttpError(404, "user not found.")

        const posts = await this.postRepo.getAll(userId)
        if (posts.length === 0)
            return []

        return posts
    }

    async likePost(likePostData: likePostDto): Promise<boolean> {

        const post = await this.postRepo.findById(likePostData.postId);
        if (!post) {
            throw new HttpError(400, "this comment does not exist");
        }

        const user = await this.userRepo.getUserByUsername(likePostData.username);
        if (!user) {
            throw new HttpError(400, "user does not exist")
        }

        const userHasLiked = await this.likePostRepo.hasUserLikedPost(likePostData.username, likePostData.postId);
        if (userHasLiked) {
            throw new HttpError(400, "User has already liked this comment");
        }

        await this.likePostRepo.likePost(likePostData);

        return true;
    }

    async unlikePost(unlikePostData: unlikePostDto): Promise<boolean> {

        const post = await this.postRepo.findById(unlikePostData.postId);
        if (!post) {
            throw new HttpError(400, "this comment does not exist");
        }

        const user = await this.userRepo.getUserByUsername(unlikePostData.username);
        if (!user) {
            throw new HttpError(400, "user does not exist")
        }

        const userHasLiked = await this.likePostRepo.hasUserLikedPost(unlikePostData.username, unlikePostData.postId);
        if (userHasLiked) {
            throw new HttpError(400, "User has not liked this comment");
        }

        await this.likePostRepo.unlikePost(unlikePostData);

        return true;
    }

}





