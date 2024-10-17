import { Router } from 'express';
import auth from '../middlewares/auth.js';
import optionalAuth from '../middlewares/optionalAuth.js';

import {
    createProduct,
    deleteProduct,
    getProduct,
    getProductById,
    searchCategory,
    searchProducts,
    updateProduct,
} from '../controllers/product.contr.js';
import {
    uploadSingleImage,
    uploadMultipleImages,
} from '../middlewares/multer.js';

const routes = Router();

routes
    .post('/createProduct', auth, uploadMultipleImages, createProduct)
    .get('/getProduct', getProduct)
    .delete('/deleteProduct/:productId', auth, deleteProduct)
    .put('/updateProduct/:productId', auth, uploadMultipleImages, updateProduct)
    .get('/getProduct/:productId', optionalAuth, getProductById)
    .get('/searchProducts', searchProducts)
    .get('/searchCategory', searchCategory);

export default routes;
