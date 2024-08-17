import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';

interface MulterFile extends Express.Multer.File {
  path: string;
}

// Set up multer storage configuration
export const storage = multer.diskStorage({
  destination: function (req: Request, file: MulterFile, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'posts');
    cb(null, uploadPath);
  },
  filename: function (req: Request, file: MulterFile, cb) {
    // Generate a secure unique filename
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Create multer upload middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req: Request, file: MulterFile, cb: FileFilterCallback) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
}).array('images', 20);

interface MulterFile extends Express.Multer.File {
  path: string;
}

// Set up multer storage configuration
export const storage1 = multer.diskStorage({
  destination: function (req: Request, file: MulterFile, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'images'); // Changed from 'uploads/posts' to 'uploads/images'
    cb(null, uploadPath);
  },
  filename: function (req: Request, file: MulterFile, cb) {
    // Generate a secure unique filename
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Create multer upload middleware
export const upload1 = multer({
  storage: storage1,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req: Request, file: MulterFile, cb: FileFilterCallback) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
}).single('image'); // Changed from `.array('images', 20)` to `.single('image')`

