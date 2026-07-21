"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocuments = exports.uploadAdditionalPhotos = exports.uploadProfilePicture = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.join(__dirname, '..', '..', 'uploads');
const profilePicsDir = path_1.default.join(uploadsDir, 'profile-pictures');
const additionalPhotosDir = path_1.default.join(uploadsDir, 'additional-photos');
const documentsDir = path_1.default.join(uploadsDir, 'documents');
[uploadsDir, profilePicsDir, additionalPhotosDir, documentsDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
});
const profileStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, profilePicsDir),
    filename: (_req, file, cb) => cb(null, `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`),
});
const photoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, additionalPhotosDir),
    filename: (_req, file, cb) => cb(null, `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`),
});
const documentStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, documentsDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${(0, uuid_1.v4)()}_${safeName}`);
    },
});
const imageFilter = (_req, file, cb) => {
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('Invalid file type'));
};
const docFilter = (_req, file, cb) => {
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
exports.uploadProfilePicture = (0, multer_1.default)({ storage: profileStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('profile_picture');
exports.uploadAdditionalPhotos = (0, multer_1.default)({ storage: photoStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('photos', 20);
exports.uploadDocuments = (0, multer_1.default)({ storage: documentStorage, fileFilter: docFilter, limits: { fileSize: 50 * 1024 * 1024 } }).array('documents', 10);
