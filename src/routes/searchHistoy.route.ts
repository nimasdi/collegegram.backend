import { Router } from "express";
import authMiddleware from "../utility/authorization";
import { Username, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { handelErrorResponse } from "../utility/habdle-errResponse";
import { SearchHistoryService } from "../services/HistorySearch.service";

export const SearchHistoryRoute = (searchHistoryService: SearchHistoryService) => {
    const router = Router();

    /**
    * @swagger
    * /searchHistory/list:
    *   get:
    *     summary: get search history
    *     description: get search history
    *     tags:
    *       - searchHistory
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: search history information retrieved successfully
    *       404:
    *         description: User not found
    *       500:
    *         description: Internal server error
    */
    router.get("/searchHistory/list", authMiddleware, async (req, res) => {
        try {
            const username = req.user.username
            
            const searchHistory = await searchHistoryService.getSearchListByUsername(username)

            res.status(200).json(searchHistory)
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });

    return router
}

