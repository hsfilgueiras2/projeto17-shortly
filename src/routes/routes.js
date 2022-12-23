import { Router } from "express";

import {postSignUp,postSignIn,postUrlShorten,getUrlById
    ,openUrl,deleteUrlById,getUserMe,getRanking} from "../controllers/controller.js"
import { validateToken } from "../middlewares/validateToken.js";
import { signInValidate } from "../middlewares/signInValidate.js";
import { signUpValidate } from "../middlewares/signUpValidate.js";

const router = Router();

router.post("/signup",signUpValidate,postSignUp)
router.post("/signin",signInValidate,postSignIn)
router.post("/urls/shorten",validateToken,postUrlShorten)
router.get("/urls/:id",getUrlById)
router.get("/urls/open/:shortUrl",openUrl)
router.delete("/urls/:id",validateToken,deleteUrlById)
router.get("/users/me",validateToken,getUserMe)
router.get("/ranking",getRanking)

export default router;