import express from 'express';
import { createOrUpdateAddress } from '../controllers/address.contr.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router
    .post('/create', auth, createOrUpdateAddress)

export default router;