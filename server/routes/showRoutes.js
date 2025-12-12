const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const showController = require('../controllers/showController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/shows - Get all shows
router.get('/', showController.getAllShows);

// GET /api/shows/available - Get available shows only
router.get('/available', showController.getAvailableShows);

// GET /api/shows/:id - Get specific show
router.get('/:id', showController.getShow);

// POST /api/shows - Create new show (admin only)
router.post('/', 
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Show name is required'),
    body('type').trim().notEmpty().withMessage('Show type is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1')
  ],
  showController.createShow
);

module.exports = router;
