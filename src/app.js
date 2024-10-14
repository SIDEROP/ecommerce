import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(express.json({ limit: '20kb' }))
    .use(express.urlencoded({ limit: '20kb', extended: true }))
    .use(cookieParser())
    .use(
        cors({
            origin: 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: [
                'Authenticate',
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'Access-Control-Allow-Headers',
            ],
        })
    )
    .options('*', cors());

// import rotes
import userRoutes from './routes/Auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentGatewayRoutes from './routes/paymentGateway.routes.js';
import dashboardRoutes from './routes/dashbord.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';

// use rotes
app.use('/api/v1/auth', userRoutes)
    .use('/api/v1/products', productRoutes)
    .use('/api/v1/cart', cartRoutes)
    .use('/api/v1/order', orderRoutes)
    .use('/api/v1/wishlist', wishlistRoutes)
    .use('/api/v1/paymentGateway', paymentGatewayRoutes)
    .use('/api/v1/dashboard', dashboardRoutes)
    .use('/api/v1/rating', ratingRoutes);

export default app;
