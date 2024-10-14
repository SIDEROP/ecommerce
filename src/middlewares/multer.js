import multer from 'multer';

// Set up storage engine
const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.originalname);
    },
});

// File filter to allow only image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};

// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 },
});

// Middleware to handle single and multiple images
export const uploadSingleImage = upload.single('image'); // For single image
export const uploadMultipleImages = upload.array('image', 5); // For multiple images (limit to 5)

export default upload;
