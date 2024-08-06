import { Response , Request, NextFunction } from "express"
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;



if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}



const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid authorization header" });
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Authorization token not found" });
    }

    try {
        const loggedInUser = jwt.verify(token, JWT_SECRET);
        (req as any).user = loggedInUser;
        next();
    } catch (error) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid or expired token" });
    }
}

export default authMiddleware;
