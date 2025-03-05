const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Main endpoint to receive form data
app.post('/', (req, res) => {
  try {
    console.log('Received data:', JSON.stringify(req.body, null, 2));
    
    // Simply log the received data and send a confirmation
    return res.status(200).json({ 
      message: 'Form submission received successfully',
      success: true
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'An error occurred while processing your request.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Export the Express API
module.exports = app;