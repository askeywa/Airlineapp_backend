// Flight Service - services/flightService.js
// Handles flight search operations and business logic

const amadeusService = require('./amadeusService');

class FlightService {
  constructor() {
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    
    // Flight search parameters validation rules
    this.validationRules = {
      origin: {
        required: true,
        minLength: 3,
        maxLength: 3,
        pattern: /^[A-Z]{3}$/
      },
      destination: {
        required: true,
        minLength: 3,
        maxLength: 3,
        pattern: /^[A-Z]{3}$/
      },
      departureDate: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      returnDate: {
        required: false,
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      adults: {
        required: false,
        min: 1,
        max: 9
      }
    };

    // Popular routes for suggestions
    this.popularRoutes = {
      'domestic_india': [
        { from: 'BOM', to: 'DEL', route: 'Mumbai → Delhi' },
        { from: 'DEL', to: 'BLR', route: 'Delhi → Bangalore' },
        { from: 'BOM', to: 'BLR', route: 'Mumbai → Bangalore' },
        { from: 'DEL', to: 'MAA', route: 'Delhi → Chennai' },
        { from: 'BOM', to: 'CCU', route: 'Mumbai → Kolkata' }
      ],
      'international': [
        { from: 'BOM', to: 'DXB', route: 'Mumbai → Dubai' },
        { from: 'DEL', to: 'LHR', route: 'Delhi → London' },
        { from: 'BLR', to: 'SIN', route: 'Bangalore → Singapore' },
        { from: 'BOM', to: 'JFK', route: 'Mumbai → New York' },
        { from: 'DEL', to: 'CDG', route: 'Delhi → Paris' }
      ]
    };
  }

  /**
   * Main flight search method
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search results with flights and metadata
   */
  async searchFlights(searchParams) {
    try {
      console.log('🔍 FlightService: Starting flight search...', searchParams);

      // Validate search parameters
      const validation = this.validateSearchParams(searchParams);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'validation',
          message: 'Invalid search parameters',
          details: validation.errors,
          suggestions: this.generateSearchSuggestions(searchParams)
        };
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(searchParams);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        console.log('✅ FlightService: Returning cached results');
        return cachedResult;
      }

      // Perform flight search via Amadeus
      const flights = await amadeusService.searchFlights(searchParams);

      // Process and enhance flight data
      const processedFlights = await this.processFlightResults(flights, searchParams);

      // Prepare response
      const result = {
        success: true,
        searchParams,
        flights: processedFlights,
        totalResults: flights.length,
        searchTime: new Date().toISOString(),
        suggestions: this.getRelatedSuggestions(searchParams)
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      console.log(`✅ FlightService: Found ${processedFlights.length} flights`);
      return result;

    } catch (error) {
      console.error('❌ FlightService: Search failed:', error);
      
      return {
        success: false,
        error: this.categorizeError(error),
        message: error.message || 'Flight search failed',
        searchParams,
        suggestions: this.generateErrorSuggestions(error, searchParams)
      };
    }
  }

  /**
   * Validate search parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateSearchParams(params) {
    const errors = [];
    const warnings = [];

    // Check required fields
    for (const [field, rules] of Object.entries(this.validationRules)) {
      const value = params[field];

      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value) {
        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }

        // Length validation
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} is too short`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} is too long`);
        }

        // Numeric range validation
        if (rules.min !== undefined && Number(value) < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && Number(value) > rules.max) {
          errors.push(`${field} must not exceed ${rules.max}`);
        }
      }
    }

    // Business logic validations
    if (params.departureDate) {
      const depDate = new Date(params.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (depDate < today) {
        errors.push('Departure date cannot be in the past');
      }

      // Warning for dates too far in future
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 365);
      if (depDate > maxDate) {
        warnings.push('Departure date is more than a year away');
      }
    }

    if (params.returnDate && params.departureDate) {
      const depDate = new Date(params.departureDate);
      const retDate = new Date(params.returnDate);

      if (retDate <= depDate) {
        errors.push('Return date must be after departure date');
      }
    }

    if (params.origin === params.destination) {
      errors.push('Origin and destination cannot be the same');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Process and enhance flight results
   * @param {Array} flights - Raw flight data
   * @param {Object} searchParams - Search parameters
   * @returns {Array} Processed flights
   */
  async processFlightResults(flights, searchParams) {
    if (!flights || flights.length === 0) {
      return [];
    }

    // Sort flights by best value (combination of price and convenience)
    const sortedFlights = flights
      .map(flight => this.calculateFlightScore(flight))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results

    // Add additional information
    return sortedFlights.map(flight => ({
      ...flight,
      searchParams,
      priceCategory: this.categorizePriceRange(flight.price?.total, flights),
      convenientScore: this.calculateConvenienceScore(flight),
      recommendation: this.generateRecommendation(flight)
    }));
  }

  /**
   * Calculate flight score for ranking
   * @param {Object} flight - Flight object
   * @returns {Object} Flight with score
   */
  calculateFlightScore(flight) {
    const flightWithScore = { ...flight };
    let score = 0;

    // Price score (lower price = higher score)
    const price = parseFloat(flight.price?.total || 999999);
    if (price < 50000) score += 30;
    else if (price < 100000) score += 20;
    else if (price < 200000) score += 10;

    // Duration score (shorter = better)
    const duration = this.parseDurationToMinutes(flight.itineraries?.[0]?.duration);
    if (duration < 120) score += 25; // Under 2 hours
    else if (duration < 300) score += 20; // Under 5 hours
    else if (duration < 600) score += 15; // Under 10 hours

    // Direct flight bonus
    const segments = flight.itineraries?.[0]?.segments || [];
    if (segments.length === 1) {
      score += 25; // Direct flight bonus
    }

    // Departure time score (prefer convenient times)
    const depHour = this.getHourFromISOString(segments[0]?.departure?.at);
    if (depHour >= 6 && depHour <= 10) score += 15; // Morning flights
    else if (depHour >= 14 && depHour <= 18) score += 10; // Afternoon flights

    // Airline reputation score
    const airlineCode = flight.validatingAirlineCodes?.[0];
    if (['AI', '6E', 'UK'].includes(airlineCode)) score += 10; // Indian carriers
    if (['EK', 'QR', 'EY'].includes(airlineCode)) score += 15; // Premium carriers

    flightWithScore.score = score;
    return flightWithScore;
  }

  /**
   * Calculate convenience score
   * @param {Object} flight - Flight object
   * @returns {number} Convenience score (0-100)
   */
  calculateConvenienceScore(flight) {
    let score = 0;
    const segments = flight.itineraries?.[0]?.segments || [];

    // Direct flight
    if (segments.length === 1) score += 40;

    // Departure time
    const depHour = this.getHourFromISOString(segments[0]?.departure?.at);
    if (depHour >= 7 && depHour <= 22) score += 30; // Reasonable hours

    // Duration
    const duration = this.parseDurationToMinutes(flight.itineraries?.[0]?.duration);
    if (duration < 180) score += 30; // Under 3 hours

    return Math.min(100, score);
  }

  /**
   * Categorize price range
   * @param {number} price - Flight price
   * @param {Array} allFlights - All flights for comparison
   * @returns {string} Price category
   */
  categorizePriceRange(price, allFlights) {
    if (!price || allFlights.length === 0) return 'unknown';

    const prices = allFlights
      .map(f => parseFloat(f.price?.total || 0))
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) return 'unknown';

    const priceNum = parseFloat(price);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const range = maxPrice - minPrice;

    if (priceNum <= minPrice + (range * 0.33)) return 'budget';
    if (priceNum <= minPrice + (range * 0.66)) return 'mid-range';
    return 'premium';
  }

  /**
   * Generate recommendation for flight
   * @param {Object} flight - Flight object
   * @returns {string} Recommendation text
   */
  generateRecommendation(flight) {
    const segments = flight.itineraries?.[0]?.segments || [];
    const isDirect = segments.length === 1;
    const priceCategory = flight.priceCategory;
    const convenienceScore = flight.convenientScore || 0;

    if (isDirect && priceCategory === 'budget') {
      return 'Best Value - Direct & Affordable';
    }
    if (isDirect && convenienceScore > 80) {
      return 'Most Convenient - Direct Flight';
    }
    if (priceCategory === 'budget') {
      return 'Budget Friendly';
    }
    if (convenienceScore > 70) {
      return 'Convenient Timing';
    }
    if (priceCategory === 'premium') {
      return 'Premium Service';
    }

    return 'Good Option';
  }

  /**
   * Generate cache key for search
   * @param {Object} params - Search parameters
   * @returns {string} Cache key
   */
  generateCacheKey(params) {
    const key = `${params.origin}-${params.destination}-${params.departureDate}-${params.returnDate || 'oneway'}-${params.adults || 1}`;
    return key.toLowerCase();
  }

  /**
   * Get cached result
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached result or null
   */
  getCachedResult(cacheKey) {
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    // Remove expired cache
    if (cached) {
      this.searchCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Cache search result
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Result to cache
   */
  cacheResult(cacheKey, result) {
    // Limit cache size
    if (this.searchCache.size > 100) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }

    this.searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
  }

  /**
   * Categorize error type
   * @param {Error} error - Error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'auth';
    }
    if (message.includes('invalid') || message.includes('parameter')) {
      return 'validation';
    }
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'rate_limit';
    }
    
    return 'api';
  }

  /**
   * Generate search suggestions
   * @param {Object} params - Search parameters
   * @returns {Array} Array of suggestions
   */
  generateSearchSuggestions(params) {
    const suggestions = [];
    
    if (!params.origin) {
      suggestions.push({
        type: 'missing_field',
        field: 'origin',
        message: 'Please specify departure city (e.g., Mumbai, BOM)',
        examples: ['Mumbai', 'Delhi', 'BOM', 'DEL']
      });
    }
    
    if (!params.destination) {
      suggestions.push({
        type: 'missing_field',
        field: 'destination',
        message: 'Please specify destination city (e.g., Delhi, DEL)',
        examples: ['Delhi', 'Dubai', 'DEL', 'DXB']
      });
    }
    
    if (!params.departureDate) {
      suggestions.push({
        type: 'missing_field',
        field: 'departureDate',
        message: 'Please specify travel date',
        examples: ['tomorrow', '25th Dec', '2025-01-15']
      });
    }
    
    return suggestions;
  }

  /**
   * Generate error-specific suggestions
   * @param {Error} error - Error object
   * @param {Object} params - Search parameters
   * @returns {Array} Array of suggestions
   */
  generateErrorSuggestions(error, params) {
    const suggestions = [];
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'network':
        suggestions.push({
          type: 'retry',
          message: 'Check your internet connection and try again',
          action: 'retry_search'
        });
        break;
        
      case 'validation':
        suggestions.push({
          type: 'format',
          message: 'Try using airport codes (3 letters) like BOM, DEL, DXB',
          examples: this.getPopularRouteSuggestions()
        });
        break;
        
      case 'rate_limit':
        suggestions.push({
          type: 'wait',
          message: 'Please wait a moment before searching again',
          waitTime: '1 minute'
        });
        break;
        
      default:
        suggestions.push({
          type: 'alternative',
          message: 'Try alternative dates or nearby airports',
          alternatives: this.getAlternativeSuggestions(params)
        });
    }
    
    return suggestions;
  }

  /**
   * Get popular route suggestions
   * @returns {Array} Popular routes
   */
  getPopularRouteSuggestions() {
    return [
      ...this.popularRoutes.domestic_india.slice(0, 3),
      ...this.popularRoutes.international.slice(0, 2)
    ];
  }

  /**
   * Get alternative suggestions based on search params
   * @param {Object} params - Search parameters
   * @returns {Array} Alternative suggestions
   */
  getAlternativeSuggestions(params) {
    const suggestions = [];
    
    if (params.departureDate) {
      const date = new Date(params.departureDate);
      const tomorrow = new Date(date);
      tomorrow.setDate(date.getDate() + 1);
      const dayAfter = new Date(date);
      dayAfter.setDate(date.getDate() + 2);
      
      suggestions.push({
        type: 'date_alternative',
        message: 'Try nearby dates',
        dates: [
          tomorrow.toISOString().split('T')[0],
          dayAfter.toISOString().split('T')[0]
        ]
      });
    }
    
    return suggestions;
  }

  /**
   * Get related suggestions for successful searches
   * @param {Object} params - Search parameters
   * @returns {Array} Related suggestions
   */
  getRelatedSuggestions(params) {
    const suggestions = [];
    
    // Return journey suggestion
    if (!params.returnDate) {
      suggestions.push({
        type: 'return_journey',
        message: `Search return flights from ${params.destination} to ${params.origin}`,
        searchParams: {
          origin: params.destination,
          destination: params.origin,
          departureDate: this.getDateAfter(params.departureDate, 7), // Suggest 1 week later
          adults: params.adults
        }
      });
    }
    
    // Alternative dates
    const altDates = this.getAlternativeDates(params.departureDate);
    suggestions.push({
      type: 'flexible_dates',
      message: 'Compare prices on nearby dates',
      dates: altDates
    });
    
    return suggestions;
  }

  // Helper Methods

  /**
   * Parse ISO duration to minutes
   * @param {string} duration - ISO duration string
   * @returns {number} Duration in minutes
   */
  parseDurationToMinutes(duration) {
    if (!duration) return 0;
    
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (!match) return 0;
      
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      
      return (hours * 60) + minutes;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Extract hour from ISO string
   * @param {string} isoString - ISO date string
   * @returns {number} Hour (0-23)
   */
  getHourFromISOString(isoString) {
    if (!isoString) return 0;
    
    try {
      return new Date(isoString).getHours();
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get date after specified days
   * @param {string} dateString - Base date string
   * @param {number} days - Days to add
   * @returns {string} New date string
   */
  getDateAfter(dateString, days) {
    try {
      const date = new Date(dateString);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Get alternative dates around given date
   * @param {string} dateString - Base date string
   * @returns {Array} Array of alternative dates
   */
  getAlternativeDates(dateString) {
    const dates = [];
    
    try {
      const baseDate = new Date(dateString);
      
      for (let i = -2; i <= 2; i++) {
        if (i !== 0) { // Skip the original date
          const altDate = new Date(baseDate);
          altDate.setDate(baseDate.getDate() + i);
          dates.push({
            date: altDate.toISOString().split('T')[0],
            label: i < 0 ? `${Math.abs(i)} day(s) earlier` : `${i} day(s) later`
          });
        }
      }
    } catch (error) {
      console.warn('Error generating alternative dates:', error);
    }
    
    return dates;
  }

  /**
   * Clear cache (for maintenance)
   */
  clearCache() {
    this.searchCache.clear();
    console.log('✅ Flight search cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.searchCache.size,
      maxSize: 100,
      timeout: this.cacheTimeout / 1000 / 60, // in minutes
      keys: Array.from(this.searchCache.keys())
    };
  }

  /**
   * Health check for flight service
   * @returns {Object} Health status
   */
  async healthCheck() {
    try {
      // Test Amadeus service
      await amadeusService.getAccessToken();
      
      return {
        status: 'healthy',
        service: 'FlightService',
        cache: this.getCacheStats(),
        amadeus: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'degraded',
        service: 'FlightService',
        cache: this.getCacheStats(),
        amadeus: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get flight details by ID
   * @param {string} flightId - Flight ID
   * @param {Object} searchParams - Original search parameters
   * @returns {Object} Flight details
   */
  async getFlightDetails(flightId, searchParams) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(searchParams);
      const cachedResult = this.getCachedResult(cacheKey);
      
      if (cachedResult && cachedResult.flights) {
        const flight = cachedResult.flights.find(f => f.id === flightId);
        if (flight) {
          return {
            success: true,
            flight: flight,
            searchParams: searchParams
          };
        }
      }
      
      // If not in cache, perform new search
      const searchResult = await this.searchFlights(searchParams);
      if (searchResult.success) {
        const flight = searchResult.flights.find(f => f.id === flightId);
        if (flight) {
          return {
            success: true,
            flight: flight,
            searchParams: searchParams
          };
        }
      }
      
      return {
        success: false,
        error: 'Flight not found',
        message: 'The requested flight is no longer available'
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'service_error',
        message: 'Unable to retrieve flight details',
        details: error.message
      };
    }
  }

  /**
   * Compare flights side by side
   * @param {Array} flightIds - Array of flight IDs to compare
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Comparison data
   */
  async compareFlights(flightIds, searchParams) {
    try {
      const flights = [];
      
      for (const flightId of flightIds) {
        const result = await this.getFlightDetails(flightId, searchParams);
        if (result.success) {
          flights.push(result.flight);
        }
      }
      
      if (flights.length === 0) {
        return {
          success: false,
          error: 'No flights found for comparison'
        };
      }
      
      // Generate comparison metrics
      const comparison = {
        flights: flights,
        comparison: {
          cheapest: this.findCheapestFlight(flights),
          fastest: this.findFastestFlight(flights),
          mostConvenient: this.findMostConvenientFlight(flights),
          direct: flights.filter(f => (f.itineraries?.[0]?.segments || []).length === 1)
        }
      };
      
      return {
        success: true,
        comparison: comparison,
        searchParams: searchParams
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'comparison_failed',
        message: error.message
      };
    }
  }

  /**
   * Find cheapest flight from array
   * @param {Array} flights - Array of flights
   * @returns {Object|null} Cheapest flight
   */
  findCheapestFlight(flights) {
    return flights.reduce((cheapest, current) => {
      const currentPrice = parseFloat(current.price?.total || Infinity);
      const cheapestPrice = parseFloat(cheapest?.price?.total || Infinity);
      return currentPrice < cheapestPrice ? current : cheapest;
    }, null);
  }

  /**
   * Find fastest flight from array
   * @param {Array} flights - Array of flights
   * @returns {Object|null} Fastest flight
   */
  findFastestFlight(flights) {
    return flights.reduce((fastest, current) => {
      const currentDuration = this.parseDurationToMinutes(current.itineraries?.[0]?.duration);
      const fastestDuration = this.parseDurationToMinutes(fastest?.itineraries?.[0]?.duration);
      return currentDuration < fastestDuration ? current : fastest;
    }, flights[0]);
  }

  /**
   * Find most convenient flight from array
   * @param {Array} flights - Array of flights
   * @returns {Object|null} Most convenient flight
   */
  findMostConvenientFlight(flights) {
    return flights.reduce((mostConvenient, current) => {
      const currentScore = this.calculateConvenienceScore(current);
      const bestScore = this.calculateConvenienceScore(mostConvenient);
      return currentScore > bestScore ? current : mostConvenient;
    }, flights[0]);
  }

  /**
   * Get price alerts setup (for future implementation)
   * @param {Object} searchParams - Search parameters
   * @param {number} targetPrice - Target price for alerts
   * @returns {Object} Alert setup result
   */
  setupPriceAlert(searchParams, targetPrice) {
    // This would integrate with a price monitoring service
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Price alert feature coming soon',
      alertId: `alert_${Date.now()}`,
      searchParams,
      targetPrice,
      status: 'pending_implementation'
    };
  }
}

module.exports = new FlightService();