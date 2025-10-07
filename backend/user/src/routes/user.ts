import express from "express";
import { loginUser, verifyUser } from "../controllers/user.js";
// import TryCatch from '../config/TryCatch';
import { isAuth } from "../middleware/isAuth.js";
import { myProfile } from "../controllers/user.js";
import { getAllUsers, getAUser, updateName } from "../controllers/user.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify-otp", verifyUser);
router.get("/me", isAuth, myProfile);
router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", getAUser);
router.post("/update/username", isAuth, updateName);

export default router;
