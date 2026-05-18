import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const profilePicsDir = path.join(uploadsDir, 'profile-pictures');
const additionalPhotosDir = path.join(uploadsDir, 'additional-photos');
const documentsDir = path.join(uploadsDir, 'documents');

[uploadsDir, profilePicsDir, additionalPhotosDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profilePicsDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, additionalPhotosDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, documentsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uuidv4()}_${safeName}`);
  },
});

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid file type'));
};

const docFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'audio/wav'
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('File type not allowed'));
};

export const uploadProfilePicture = multer({ storage: profileStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('profile_picture');
export const uploadAdditionalPhotos = multer({ storage: photoStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('photos', 20);
export const uploadDocuments = multer({ storage: documentStorage, fileFilter: docFilter, limits: { fileSize: 50 * 1024 * 1024 } }).array('documents', 10);
