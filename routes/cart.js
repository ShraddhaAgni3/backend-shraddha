import express from "express";
import {getCartItems, addToCart, deleteCartItem} from  "../controller/cartController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";
const router = express.Router();

router.use(validateAccessToken);
router.get("/:user_id", getCartItems);  // Get Cart Items by User ID //-
router.post("/", addToCart); // Add Item to Cart
router.delete("/:id", deleteCartItem); // Delete Cart Item by ID

export default router;
