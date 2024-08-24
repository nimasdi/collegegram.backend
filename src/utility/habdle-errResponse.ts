import { Response } from "express";
import { HttpError } from "./error-handler";
import { ZodError } from "zod";

export const handelErrorResponse = async ( res : Response , error: any) => {
    if(error instanceof ZodError){
        const errorsMessage = error.errors.reduce((prev,e) => {return {...prev,[e.path[0]]:e.message}},{})
        return res.status(400).json(errorsMessage)
    }

    if(error instanceof HttpError){
        return res.status(error.status).json({message:error.message})
    }

    return res.status(500).json({message:"server error"})
};