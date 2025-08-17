// Flight routes - routes/flights.js (Optimized)
const express = require('express');
const router = express.Router();

// Import service with error handling
let amadeusService;
try {
  amadeusService = require('../services/amadeusService');
  console.log('✅ Amadeus service loaded');
} catch (error) {
  console.error('❌ Error loading Amadeus service:', error.message);
}

// Input validation middleware
const validateFlightSearch = (req, res, next) => {
  const { origin, destination, departureDate } = req.query;
  
  const errors = [];
  if (!origin) errors.push('origin is required');
  if (!destination) errors.push('destination is required');
  if (!departureDate) errors.push('departureDate is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['origin', 'destination', 'departureDate'],
      missing: errors
    });
  }
  
  next();
};

// Test endpoint to search flights directly
router.get('/search', validateFlightSearch, async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults } = req.query;
    
    // Check if service is available
    if (!amadeusService) {
      return res.status(503).json({
        error: 'Flight search service unavailable',
        message: 'Amadeus service not loaded'
      });
    }

    console.log(`🔍 Flight search request: ${origin} → ${destination} on ${departureDate}`);

    const searchParams = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      adults: parseInt(adults) || 1
    };

    const flights = await amadeusService.searchFlights(searchParams);

    if (!flights || flights.length === 0) {
      return res.json({
        success: true,
        flights: [],
        message: 'No flights found for the specified criteria'
      });
    }

    // Return formatted response
    res.json({
      success: true,
      searchParams,
      totalResults: flights.length,
      flights: flights.slice(0, 5).map(flight => ({
        id: flight.id,
        price: {
          total: flight.price?.total,
          currency: flight.price?.currency
        },
        duration: flight.itineraries?.[0]?.duration,
        airline: flight.validatingAirlineCodes?.[0],
        departure: {
          airport: flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode,
          time: flight.itineraries?.[0]?.segments?.[0]?.departure?.at
        },
        arrival: {
          airport: flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode,
          time: flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.at
        }
      }))
    });
    
  } catch (error) {
    console.error('❌ Flight search error:', error.message);
    
    // Return user-friendly error messages
    let errorMessage = 'Flight search failed';
    let statusCode = 500;
    
    if (error.message.includes('Authentication failed')) {
      errorMessage = 'API authentication failed';
      statusCode = 503;
    } else if (error.message.includes('Invalid flight search parameters')) {
      errorMessage = 'Invalid search parameters';
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// Health check for flights service
router.get('/health', (req, res) => {
  res.json({
    status: 'Flight service is running',
    serviceLoaded: !!amadeusService,
    timestamp: new Date().toISOString()
  });
});

// Get airport suggestions (if service is available)
router.get('/airports', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Query parameter "q" is required (min 2 characters)'
      });
    }
    
    if (!amadeusService || !amadeusService.getLocationSuggestions) {
      return res.json({
        suggestions: [],
        message: 'Location suggestions service not available'
      });
    }
    
    const suggestions = await amadeusService.getLocationSuggestions(query);
    
    res.json({
      query,
      suggestions: suggestions.slice(0, 5)
    });
    
  } catch (error) {
    console.error('❌ Airport suggestions error:', error.message);
    res.status(500).json({
      error: 'Failed to get airport suggestions',
      query: req.query.q || ''
    });
  }
});

module.exports = router;