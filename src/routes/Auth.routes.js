import { Router } from 'express'
import {
    loginAdmin,
    loginUser,
    logoutUser,
    registerUser,
    reLoginUser,
    updateUser,
} from '../controllers/authUser.contr.js'
import auth from '../middlewares/auth.js'

const routes = Router()

routes
    .post('/registerUser', registerUser)
    .post('/loginUser', loginUser)
    .post('/loginAdmin', loginAdmin)
    .get('/reLogin', auth, reLoginUser)
    .get('/logoutUser', auth, logoutUser)
    .put('/updateUser', auth, updateUser)

export default routes
