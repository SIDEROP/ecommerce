import { Router } from 'express';
import auth from '../middlewares/auth.js';
import {
    createProduct,
    deleteProduct,
    getProduct,
    getProductById,
    searchCategory,
    searchProducts,
    updateProduct,
} from '../controllers/product.contr.js';
import { uploadSingleImage, uploadMultipleImages } from '../middlewares/multer.js'; // Import single and multiple upload functions

const routes = Router();

routes
    .post('/createProduct', auth, uploadMultipleImages, createProduct) // For single image upload
    .get('/getProduct', getProduct)
    .delete('/deleteProduct/:productId', auth, deleteProduct)
    .put('/updateProduct/:productId', auth, uploadMultipleImages, updateProduct) // Single image update
    .get('/getProduct/:productId', getProductById)
    .get('/searchProducts', searchProducts)
    .get('/searchCategory', searchCategory)
    // .post('/createProductMultiple', auth, uploadMultipleImages, createProduct); // New route for multiple image upload

export default routes;
