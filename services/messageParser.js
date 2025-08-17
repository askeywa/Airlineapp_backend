// Message Parser Service - services/messageParser.js
// Handles natural language processing for flight queries

class MessageParser {
  constructor() {
    this.cityToCode = {
      // Major Indian Cities
      'mumbai': 'BOM', 'bombay': 'BOM', 'bom': 'BOM',
      'delhi': 'DEL', 'new delhi': 'DEL', 'del': 'DEL',
      'bangalore': 'BLR', 'bengaluru': 'BLR', 'blr': 'BLR',
      'chennai': 'MAA', 'madras': 'MAA', 'maa': 'MAA',
      'kolkata': 'CCU', 'calcutta': 'CCU', 'ccu': 'CCU',
      'hyderabad': 'HYD', 'hyd': 'HYD',
      'pune': 'PNQ', 'pnq': 'PNQ',
      'ahmedabad': 'AMD', 'amd': 'AMD',
      'kochi': 'COK', 'cochin': 'COK', 'cok': 'COK',
      'goa': 'GOI', 'goi': 'GOI',
      
      // International Cities
      'new york': 'NYC', 'nyc': 'NYC', 'new york city': 'NYC',
      'los angeles': 'LAX', 'la': 'LAX', 'lax': 'LAX',
      'london': 'LHR', 'lhr': 'LHR',
      'paris': 'CDG', 'cdg': 'CDG',
      'dubai': 'DXB', 'dxb': 'DXB',
      'singapore': 'SIN', 'sin': 'SIN',
      'bangkok': 'BKK', 'bkk': 'BKK',
      'tokyo': 'NRT', 'nrt': 'NRT',
      'sydney': 'SYD', 'syd': 'SYD',
      'melbourne': 'MEL', 'mel': 'MEL',
      'toronto': 'YYZ', 'yyz': 'YYZ',
      'vancouver': 'YVR', 'yvr': 'YVR',
      'doha': 'DOH', 'doh': 'DOH',
      'amsterdam': 'AMS', 'ams': 'AMS',
      'frankfurt': 'FRA', 'fra': 'FRA',
      'zurich': 'ZUR', 'zur': 'ZUR',
      
      // Popular routes
      'jfk': 'JFK', 'lga': 'LGA', 'ewr': 'EWR',
      'heathrow': 'LHR', 'gatwick': 'LGW',
      'orly': 'ORY', 'charles de gaulle': 'CDG',
      'narita': 'NRT', 'haneda': 'HND'
    };

    this.dateFormats = [
      // Standard formats
      /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g, // YYYY-MM-DD or YYYY/MM/DD
      /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/g, // DD-MM-YYYY or MM/DD/YYYY
      
      // Natural language dates
      /\b(today|tomorrow)\b/gi,
      /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi,
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:\d{4})?)\b/gi,
      /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\s*(?:\d{4})?)\b/gi
    ];

    this.patterns = {
      // Basic patterns
      simple: /^(\w+)\s+to\s+(\w+)\s+on\s+(.+?)(?:\s+for\s+(\d+))?(?:\s+passengers?)?$/i,
      
      // Extended patterns
      flight_from_to: /(?:flight|fly|book|search|ticket).*?from\s+(\w+)\s+to\s+(\w+)/i,
      from_to_on: /from\s+(\w+)\s+to\s+(\w+)\s+on\s+(.+?)(?:\s+for\s+(\d+))?/i,
      origin_destination: /(\w+)\s*(?:to|->|→)\s*(\w+)/i,
      
      // Alternative patterns
      travel_pattern: /(?:travel|going|visit)\s+(?:from\s+)?(\w+)\s+to\s+(\w+)/i,
      need_flight: /need\s+(?:a\s+)?flight\s+(?:from\s+)?(\w+)\s+to\s+(\w+)/i,
      
      // Passenger patterns
      passengers: /(?:for\s+(\d+)\s+(?:passengers?|people|adults?|pax))|(\d+)\s+(?:passengers?|people|adults?|pax)/i,
      
      // Return flight patterns
      return_flight: /return\s+(?:on\s+|flight\s+|trip\s+)?(.+?)(?:\s|$)/i,
      round_trip: /round\s*trip|return\s*journey|two\s*way/i
    };

    this.flightKeywords = [
      'flight', 'flights', 'fly', 'book', 'search', 'ticket', 'tickets',
      'travel', 'trip', 'journey', 'airline', 'air', 'plane', 'aircraft',
      'departure', 'arrival', 'airport', 'booking', 'reservation',
      'vacation', 'holiday', 'visit', 'going', 'need', 'want'
    ];
  }

  /**
   * Main parsing function - analyzes message and extracts flight search parameters
   * @param {string} message - User message to parse
   * @returns {Object} Parsed flight search parameters
   */
  parseFlightQuery(message) {
    const cleanMessage = this.cleanMessage(message);
    console.log('🔍 Parsing message:', cleanMessage);

    // Initialize default search parameters
    const searchParams = {
      origin: null,
      destination: null,
      departureDate: null,
      returnDate: null,
      adults: 1,
      isRoundTrip: false,
      confidence: 0,
      messageType: this.identifyMessageType(cleanMessage)
    };

    // Early return if not a flight query
    if (!this.isFlightQuery(cleanMessage)) {
      searchParams.confidence = 0;
      return searchParams;
    }

    // Try different parsing approaches
    const parsedData = this.tryMultiplePatterns(cleanMessage);
    
    if (parsedData) {
      Object.assign(searchParams, parsedData);
      searchParams.confidence = this.calculateConfidence(searchParams);
    }

    // Validate and format the results
    this.validateAndFormat(searchParams);

    console.log('📊 Parsing result:', searchParams);
    return searchParams;
  }

  /**
   * Clean and normalize the message
   * @param {string} message - Raw message
   * @returns {string} Cleaned message
   */
  cleanMessage(message) {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\-\/.,]/g, ' ') // Remove special chars except date separators
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\b(please|pls|can you|could you|i want|i need|help me)\b/g, '') // Remove politeness words
      .trim();
  }

  /**
   * Identify the type of message
   * @param {string} message - Cleaned message
   * @returns {string} Message type
   */
  identifyMessageType(message) {
    if (message.includes('help') || message.includes('how')) return 'help';
    if (message.includes('cancel') || message.includes('refund')) return 'support';
    if (message.includes('status') || message.includes('check')) return 'status';
    if (this.isFlightQuery(message)) return 'flight_search';
    return 'general';
  }

  /**
   * Check if message is a flight-related query
   * @param {string} message - Message to check
   * @returns {boolean} True if flight related
   */
  isFlightQuery(message) {
    const hasKeyword = this.flightKeywords.some(keyword => 
      message.includes(keyword)
    );
    
    const hasLocationPattern = /\b\w{3}\b.*\b\w{3}\b/.test(message) || 
                              message.includes(' to ') || 
                              message.includes(' from ');
    
    const hasDatePattern = this.dateFormats.some(pattern => pattern.test(message));
    
    return hasKeyword || (hasLocationPattern && hasDatePattern);
  }

  /**
   * Try multiple parsing patterns to extract information
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data or null
   */
  tryMultiplePatterns(message) {
    const patterns = [
      this.parseSimplePattern.bind(this),
      this.parseFromToPattern.bind(this),
      this.parseFlightRequestPattern.bind(this),
      this.parseLocationOnlyPattern.bind(this)
    ];

    for (const parseFunc of patterns) {
      const result = parseFunc(message);
      if (result && result.origin && result.destination) {
        console.log('✅ Pattern matched:', parseFunc.name);
        return result;
      }
    }

    return null;
  }

  /**
   * Parse simple "A to B on DATE" pattern
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseSimplePattern(message) {
    const match = message.match(this.patterns.simple);
    if (!match) return null;

    return {
      origin: this.convertCityToCode(match[1]),
      destination: this.convertCityToCode(match[2]),
      departureDate: this.parseDate(match[3]),
      adults: match[4] ? parseInt(match[4]) : 1
    };
  }

  /**
   * Parse "from X to Y" pattern with date extraction
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseFromToPattern(message) {
    const locationMatch = message.match(this.patterns.from_to_on) || 
                         message.match(this.patterns.flight_from_to);
    
    if (!locationMatch) return null;

    const result = {
      origin: this.convertCityToCode(locationMatch[1]),
      destination: this.convertCityToCode(locationMatch[2]),
      adults: 1
    };

    // Extract date from the message
    const dateStr = locationMatch[3] || this.extractDateFromMessage(message);
    if (dateStr) {
      result.departureDate = this.parseDate(dateStr);
    }

    // Extract passenger count
    const passengerMatch = message.match(this.patterns.passengers);
    if (passengerMatch) {
      result.adults = parseInt(passengerMatch[1] || passengerMatch[2]);
    }

    // Check for return trip
    if (this.patterns.round_trip.test(message)) {
      result.isRoundTrip = true;
      const returnMatch = message.match(this.patterns.return_flight);
      if (returnMatch) {
        result.returnDate = this.parseDate(returnMatch[1]);
      }
    }

    return result;
  }

  /**
   * Parse travel/flight request patterns
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseFlightRequestPattern(message) {
    const patterns = [
      this.patterns.travel_pattern,
      this.patterns.need_flight,
      this.patterns.origin_destination
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          origin: this.convertCityToCode(match[1]),
          destination: this.convertCityToCode(match[2]),
          departureDate: this.extractDateFromMessage(message),
          adults: this.extractPassengerCount(message)
        };
      }
    }

    return null;
  }

  /**
   * Parse location-only patterns (extract locations from anywhere in message)
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseLocationOnlyPattern(message) {
    const words = message.split(/\s+/);
    const locations = [];

    for (const word of words) {
      const code = this.convertCityToCode(word);
      if (code && code.length === 3 && code !== word.toUpperCase()) {
        locations.push(code);
      }
    }

    if (locations.length >= 2) {
      return {
        origin: locations[0],
        destination: locations[1],
        departureDate: this.extractDateFromMessage(message),
        adults: this.extractPassengerCount(message)
      };
    }

    return null;
  }

  /**
   * Extract date from message using various patterns
   * @param {string} message - Message to check
   * @returns {string|null} Formatted date or null
   */
  extractDateFromMessage(message) {
    for (const pattern of this.dateFormats) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(message);
      if (match) {
        return this.parseDate(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract passenger count from message
   * @param {string} message - Message to check
   * @returns {number} Number of passengers
   */
  extractPassengerCount(message) {
    const match = message.match(this.patterns.passengers);
    if (match) {
      const count = parseInt(match[1] || match[2]);
      return Math.max(1, Math.min(9, count)); // Limit between 1-9
    }
    return 1;
  }

  /**
   * Parse and format date string
   * @param {string} dateStr - Date string to parse
   * @returns {string|null} Formatted date (YYYY-MM-DD) or null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    const cleanDate = dateStr.trim().toLowerCase();

    // Handle relative dates
    if (cleanDate === 'today') {
      return this.formatDate(today);
    }
    
    if (cleanDate === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return this.formatDate(tomorrow);
    }

    // Handle next weekday
    const nextDayMatch = cleanDate.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (nextDayMatch) {
      const targetDay = nextDayMatch[1];
      const date = this.getNextWeekday(today, targetDay);
      return this.formatDate(date);
    }

    // Try to parse standard date formats
    try {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return this.formatDate(parsedDate);
      }
    } catch (error) {
      console.warn('Date parsing error:', error.message);
    }

    return null;
  }

  /**
   * Get next occurrence of a weekday
   * @param {Date} fromDate - Starting date
   * @param {string} targetDay - Target weekday name
   * @returns {Date} Next occurrence of the weekday
   */
  getNextWeekday(fromDate, targetDay) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIndex = days.indexOf(targetDay.toLowerCase());
    const currentIndex = fromDate.getDay();
    
    let daysToAdd = targetIndex - currentIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Get next week's occurrence
    }
    
    const resultDate = new Date(fromDate);
    resultDate.setDate(fromDate.getDate() + daysToAdd);
    return resultDate;
  }

  /**
   * Format date to YYYY-MM-DD
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert city name to IATA code
   * @param {string} cityName - City name to convert
   * @returns {string} IATA code or original string
   */
  convertCityToCode(cityName) {
    if (!cityName) return '';
    
    const normalized = cityName.toLowerCase().trim();
    
    // Check if it's already a valid IATA code (3 letters)
    if (/^[a-z]{3}$/i.test(cityName)) {
      return cityName.toUpperCase();
    }
    
    return this.cityToCode[normalized] || cityName.toUpperCase();
  }

  /**
   * Calculate confidence score for parsed data
   * @param {Object} searchParams - Parsed search parameters
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(searchParams) {
    let score = 0;
    
    if (searchParams.origin && searchParams.origin.length === 3) score += 0.3;
    if (searchParams.destination && searchParams.destination.length === 3) score += 0.3;
    if (searchParams.departureDate) score += 0.3;
    if (searchParams.adults > 0) score += 0.1;
    
    return Math.min(1, score);
  }

  /**
   * Validate and format search parameters
   * @param {Object} searchParams - Parameters to validate
   */
  validateAndFormat(searchParams) {
    // Ensure IATA codes are uppercase
    if (searchParams.origin) {
      searchParams.origin = searchParams.origin.toUpperCase().substring(0, 3);
    }
    if (searchParams.destination) {
      searchParams.destination = searchParams.destination.toUpperCase().substring(0, 3);
    }
    
    // Validate passenger count
    if (searchParams.adults) {
      searchParams.adults = Math.max(1, Math.min(9, parseInt(searchParams.adults)));
    }
    
    // Validate dates
    if (searchParams.departureDate) {
      const depDate = new Date(searchParams.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (depDate < today) {
        console.warn('Departure date is in the past, adjusting...');
        searchParams.departureDate = this.formatDate(today);
      }
    }
  }

  /**
   * Generate suggestions for improving the query
   * @param {Object} searchParams - Current search parameters
   * @returns {Array} Array of suggestions
   */
  generateSuggestions(searchParams) {
    const suggestions = [];
    
    if (!searchParams.origin) {
      suggestions.push('Please specify your departure city/airport');
    }
    
    if (!searchParams.destination) {
      suggestions.push('Please specify your destination city/airport');
    }
    
    if (!searchParams.departureDate) {
      suggestions.push('Please specify your travel date (e.g., "tomorrow", "25th Dec", "2025-01-15")');
    }
    
    return suggestions;
  }

  /**
   * Get example query formats
   * @returns {Array} Array of example queries
   */
  getExampleQueries() {
    return [
      "Flight from Mumbai to Delhi tomorrow",
      "BOM to DEL on 25th December for 2 passengers",
      "Need tickets from NYC to London on 2025-01-15",
      "Travel Delhi to Dubai next Monday",
      "Book flight Mumbai to Singapore on Jan 20th",
      "Round trip Mumbai to Bangkok on 15th Jan return 25th Jan"
    ];
  }
}

module.exports = new MessageParser();