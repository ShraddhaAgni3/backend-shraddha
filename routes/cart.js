import express from "express";
import {getCartItems, addToCart, deleteCartItem} from  "../controller/cartController.js";
const router = express.Router();

router.get("/:user_id", getCartItems);
router.post("/", addToCart);
router.delete("/:id", deleteCartItem);

export default router;
