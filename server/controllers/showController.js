const Show = require('../models/Show');
const { validationResult } = require('express-validator');

// List all shows
exports.getAllShows = async (req, res) => {
  try {
    const shows = await Show.getAll();
    res.json({
      success: true,
      data: shows,
      count: shows.length
    });
  } catch (error) {
    console.error('Error fetching shows:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch shows' 
    });
  }
};

// List available shows (with seats and in future)
exports.getAvailableShows = async (req, res) => {
  try {
    const shows = await Show.getAvailable();
    res.json({
      success: true,
      data: shows,
      count: shows.length
    });
  } catch (error) {
    console.error('Error fetching available shows:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch available shows' 
    });
  }
};

// Get single show details
exports.getShow = async (req, res) => {
  try {
    const { id } = req.params;
    const show = await Show.getById(id);
    
    if (!show) {
      return res.status(404).json({ 
        success: false, 
        error: 'Show not found' 
      });
    }

    res.json({
      success: true,
      data: show
    });
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch show details' 
    });
  }
};

// Create new show (admin endpoint)
exports.createShow = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, type, startTime, price, totalSeats } = req.body;

    // Basic validation
    if (!type || !price) {
      return res.status(400).json({
        success: false,
        error: 'Type and price are required'
      });
    }

    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be in the future'
      });
    }

    if (totalSeats < 1 || totalSeats > 500) {
      return res.status(400).json({
        success: false,
        error: 'Total seats must be between 1 and 500'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be non-negative'
      });
    }

    const show = await Show.create(name, type, startTime, price, totalSeats);
    
    res.status(201).json({
      success: true,
      message: 'Show created successfully',
      data: show
    });
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create show' 
    });
  }
};
