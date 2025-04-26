import express from "express";
import { register, login } from "../controllers/Authentication.js";


const router = express.Router();

// Register & Login
router.post("/register", register);
router.post("/login", login);



export default router;
