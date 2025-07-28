import express from 'express';
import { getAllCafes, getCafeById, createCafe, deleteCafe } from '../controllers/cafeController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getAllCafes);
router.post('/', upload.single('image'), createCafe);
router.delete('/:id', deleteCafe);
router.get('/:id', getCafeById);

export default router;
