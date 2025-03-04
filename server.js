const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to calculate estimated solar savings
function calculateSolarSavings(data) {
  const { location, propertyInfo } = data;
  
  // Extract relevant data
  const { latitude, longitude } = location;
  const { isOwner, monthlyElectricityBill } = propertyInfo;
  
  // Simple solar savings calculation based on location and electricity usage
  // In a real application, this would use more sophisticated calculations
  // based on solar irradiance data for the specific location
  
  // Calculate annual electricity cost
  const annualElectricityCost = monthlyElectricityBill * 12;
  
  // Base savings percentage - would normally be calculated using solar irradiance data
  // Higher latitude generally means less solar exposure (simplified)
  let solarEfficiency = 0.75;
  
  // Adjust efficiency based on latitude (simplified calculation)
  // Optimal latitude in US is around 35 degrees
  const optimalLatitude = 35;
  const latitudeDifference = Math.abs(latitude - optimalLatitude);
  
  // Reduce efficiency as we move away from optimal latitude
  solarEfficiency -= (latitudeDifference * 0.005);
  
  // Calculate annual savings
  const annualSavings = Math.round(annualElectricityCost * solarEfficiency);
  
  // Calculate system size recommendation based on monthly bill
  // Rough estimate: 1kW system for every $120 in monthly bill
  const recommendedSystemSize = Math.round((monthlyElectricityBill / 120) * 10) / 10;
  
  // Estimated cost of system ($3000 per kW)
  const estimatedSystemCost = Math.round(recommendedSystemSize * 3000);
  
  // Calculate payback period in years
  const paybackPeriod = Math.round((estimatedSystemCost / annualSavings) * 10) / 10;
  
  // Calculate lifetime savings (25 year system life)
  const lifetimeSavings = annualSavings * 25 - estimatedSystemCost;
  
  return {
    annualSavings,
    recommendedSystemSize,
    estimatedSystemCost,
    paybackPeriod,
    lifetimeSavings,
    // Include a field to indicate if the person is eligible
    eligible: isOwner // Only homeowners are eligible in this simple example
  };
}

// Main endpoint to receive solar calculator form data
app.post('/api', (req, res) => {
  try {
    console.log('Received data:', JSON.stringify(req.body, null, 2));
    
    // Validate request body
    const { userInfo, location, propertyInfo } = req.body;
    
    if (!userInfo || !location || !propertyInfo) {
      return res.status(400).json({ 
        error: 'Missing required data. Please ensure userInfo, location, and propertyInfo are provided.' 
      });
    }
    
    if (!location.latitude || !location.longitude) {
      return res.status(400).json({ 
        error: 'Missing location coordinates. Please ensure latitude and longitude are provided.' 
      });
    }
    
    // Calculate solar savings
    const result = calculateSolarSavings(req.body);
    
    // Store user data in database (simulated)
    console.log('Storing lead information for:', userInfo.name);
    
    // Return the calculation result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request.' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Solar Calculator API is running' });
});

// Only start the server if we're not in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Export for testing