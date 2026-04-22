import { Router } from "express";
import authRoutes from "./authRoutes.js";
import listingRoutes from "./listingRoutes.js";
import savedRoutes from "./savedRoutes.js";
import chatRoutes from "./chatRoutes.js";
import userRoutes from "./userRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import threadRoutes from "./threadRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/listings", listingRoutes);
router.use("/products", listingRoutes);
router.use("/saved", savedRoutes);
router.use("/chat", chatRoutes);
router.use("/threads", threadRoutes);
router.use("/users", userRoutes);
router.use("/uploads", uploadRoutes);

export default router;