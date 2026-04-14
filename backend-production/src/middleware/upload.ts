import multer from 'multer';

// ============================================================================
// MEMORY STORAGE (for all uploads — files stored as base64 in DB, not on disk)
// ============================================================================
// Railway uses ephemeral containers. Any files saved to disk are lost on redeploy.
// All uploads now use memoryStorage and are converted to base64 data URLs
// before being stored in the PostgreSQL database.

const memStorage = multer.memoryStorage();

// ============================================================================
// Helper: Convert multer buffer to a base64 data URL
// ============================================================================
export function bufferToDataUrl(buffer: Buffer, mimetype: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
}

// File filter for general documents
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

// Image-only file filter
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Allowed: JPG, PNG, WEBP'));
  }
};

export const uploadMaterial = multer({
  storage: memStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

export const uploadCourseImage = multer({
  storage: memStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for images
  },
});

export const uploadProfileImage = multer({
  storage: memStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadMessageAttachment = multer({
  storage: memStorage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max for message attachments
  },
});
