import express from 'express';
import { loginUser ,verifyUser } from "../controllers/user.js"
// import TryCatch from '../config/TryCatch';


const router   = express.Router();

router.post('/login', loginUser);
router.post('/verify-otp', verifyUser);


export default router;