// src/routes/example.routes.js
import express from 'express';
import exampleController from '../controllers/example.controller.js';

const router = express.Router();

// Rutas para tu example_table
router.get('/', exampleController.getAll);
router.post('/', exampleController.create);

export default router;