import express from 'express';
import { getAllCafes, getCafeById, createCafe, deleteCafe, getNearbyCafes } from '../controllers/cafeController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getAllCafes);
router.post('/', upload.single('image'), createCafe);
router.delete('/:id', deleteCafe);
router.get('/:id', getCafeById);
router.get('/nearby', getNearbyCafes);
export default router;
