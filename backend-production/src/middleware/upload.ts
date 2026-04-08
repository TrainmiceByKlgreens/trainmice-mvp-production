import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directories if they don't exist
const materialsDir = path.join(__dirname, '../../uploads/course-materials');
const imagesDir = path.join(__dirname, '../../uploads/course-images');
const profileImagesDir = path.join(__dirname, '../../uploads/profile-images');
const messageAttachmentsDir = path.join(__dirname, '../../uploads/message-attachments');

if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}
if (!fs.existsSync(messageAttachmentsDir)) {
  fs.mkdirSync(messageAttachmentsDir, { recursive: true });
}

// Configure storage for materials
const materialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, materialsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for images
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `course-image-${name}-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for trainer profile images
const profileImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profileImagesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `trainer-profile-${name}-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for message attachments
const messageAttachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, messageAttachmentsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `msg-attach-${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'video/mp4',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, MP4, XLS, XLSX, TXT'));
  }
};

export const uploadMaterial = multer({
  storage: materialStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

export const uploadCourseImage = multer({
  storage: imageStorage,
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Allowed: JPG, PNG, WEBP'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for images
  },
});

export const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Allowed: JPG, PNG, WEBP'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadMessageAttachment = multer({
  storage: messageAttachmentStorage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max for message attachments
  },
});
