// Fixed Message Parser Service - services/messageParser.js
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
      'jaipur': 'JAI', 'jai': 'JAI',
      'lucknow': 'LKO', 'lko': 'LKO',
      'indore': 'IDR', 'idr': 'IDR',
      'bhubaneswar': 'BBI', 'bbi': 'BBI',
      'coimbatore': 'CJB', 'cjb': 'CJB',
      'thiruvananthapuram': 'TRV', 'trivandrum': 'TRV', 'trv': 'TRV',
      
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
      // Standard formats - Fixed to be non-global for proper reset
      /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/i, // YYYY-MM-DD or YYYY/MM/DD
      /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/i, // DD-MM-YYYY or MM/DD/YYYY
      
      // Natural language dates
      /\b(today|tomorrow)\b/i,
      /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:\d{4})?)\b/i,
      /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\s*(?:\d{4})?)\b/i,
      
      // Additional date formats for better parsing
      /\b(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})\b/i,
      /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\s+\d{4})\b/i
    ];

    this.patterns = {
      // Enhanced patterns for better matching
      simple: /^(\w+)\s+to\s+(\w+)\s+on\s+(.+?)(?:\s+for\s+(\d+))?(?:\s+passengers?)?$/i,
      
      // More flexible patterns
      from_to_on: /(?:from\s+)?(\w+(?:\s+\w+)*)\s+to\s+(\w+(?:\s+\w+)*)\s+on\s+(.+?)(?:\s+for\s+(\d+))?/i,
      flight_from_to: /(?:flight|fly|book|search|ticket).*?(?:from\s+)?(\w+(?:\s+\w+)*)\s+to\s+(\w+(?:\s+\w+)*)/i,
      basic_to_pattern: /(\w+(?:\s+\w+)*)\s+to\s+(\w+(?:\s+\w+)*)/i,
      
      // Alternative patterns
      travel_pattern: /(?:travel|going|visit)\s+(?:from\s+)?(\w+(?:\s+\w+)*)\s+to\s+(\w+(?:\s+\w+)*)/i,
      need_flight: /need\s+(?:a\s+)?flight\s+(?:from\s+)?(\w+(?:\s+\w+)*)\s+to\s+(\w+(?:\s+\w+)*)/i,
      
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

    this.monthNames = {
      'january': '01', 'jan': '01',
      'february': '02', 'feb': '02',
      'march': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'may': '05',
      'june': '06', 'jun': '06',
      'july': '07', 'jul': '07',
      'august': '08', 'aug': '08',
      'september': '09', 'sep': '09', 'sept': '09',
      'october': '10', 'oct': '10',
      'november': '11', 'nov': '11',
      'december': '12', 'dec': '12'
    };
  }

  /**
   * Main parsing function - analyzes message and extracts flight search parameters
   * @param {string} message - User message to parse
   * @returns {Object} Parsed flight search parameters
   */
  parseFlightQuery(message) {
    const cleanMessage = this.cleanMessage(message);
    console.log('🔍 Parsing message:', cleanMessage);
    console.log('📝 Original message:', message);

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
      console.log('❌ Not identified as flight query');
      searchParams.confidence = 0;
      return searchParams;
    }

    console.log('✅ Identified as flight query');

    // Try different parsing approaches
    const parsedData = this.tryMultiplePatterns(cleanMessage);
    
    if (parsedData) {
      Object.assign(searchParams, parsedData);
      searchParams.confidence = this.calculateConfidence(searchParams);
      console.log('✅ Successfully parsed with confidence:', searchParams.confidence);
    } else {
      console.log('❌ No patterns matched successfully');
    }

    // Validate and format the results
    this.validateAndFormat(searchParams);

    console.log('📊 Final parsing result:', {
      origin: searchParams.origin,
      destination: searchParams.destination,
      departureDate: searchParams.departureDate,
      adults: searchParams.adults,
      confidence: searchParams.confidence
    });

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
      .replace(/\b(please|pls|can you|could you|i want|i need|help me|book|search)\b/g, '') // Remove politeness words
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
    
    const hasToPattern = message.includes(' to ');
    const hasFromPattern = message.includes(' from ');
    const hasLocationPattern = hasToPattern || hasFromPattern;
    
    // Check for city names in the message
    const hasCityNames = Object.keys(this.cityToCode).some(city => 
      message.includes(city)
    );
    
    const hasDatePattern = this.dateFormats.some(pattern => {
      pattern.lastIndex = 0; // Reset regex state
      return pattern.test(message);
    });
    
    const hasPassengerPattern = /\d+\s*(?:passenger|people|adult|pax)/.test(message);
    
    console.log('🔍 Flight query analysis:', {
      hasKeyword,
      hasLocationPattern,
      hasCityNames,
      hasDatePattern,
      hasPassengerPattern,
      decision: hasKeyword || hasLocationPattern || (hasCityNames && (hasDatePattern || hasPassengerPattern))
    });
    
    return hasKeyword || hasLocationPattern || (hasCityNames && (hasDatePattern || hasPassengerPattern));
  }

  /**
   * Try multiple parsing patterns to extract information
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data or null
   */
  tryMultiplePatterns(message) {
    const patterns = [
      this.parseFromToPattern.bind(this),
      this.parseSimplePattern.bind(this),
      this.parseFlightRequestPattern.bind(this),
      this.parseLocationOnlyPattern.bind(this),
      this.parseBasicToPattern.bind(this)  // New pattern for simple "X to Y" format
    ];

    for (const parseFunc of patterns) {
      console.log(`🧪 Trying pattern: ${parseFunc.name}`);
      const result = parseFunc(message);
      if (result && result.origin && result.destination) {
        console.log('✅ Pattern matched:', parseFunc.name, result);
        return result;
      } else if (result) {
        console.log('⚠️ Partial match:', parseFunc.name, result);
      }
    }

    console.log('❌ No patterns matched');
    return null;
  }

  /**
   * Parse basic "X to Y" pattern - NEW METHOD
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseBasicToPattern(message) {
    const match = message.match(this.patterns.basic_to_pattern);
    if (!match) return null;

    const origin = this.convertCityToCode(match[1].trim());
    const destination = this.convertCityToCode(match[2].trim());

    // Only proceed if both cities are valid
    if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
      return null;
    }

    const result = {
      origin: origin,
      destination: destination,
      adults: this.extractPassengerCount(message)
    };

    // Extract date from anywhere in the message
    const dateStr = this.extractDateFromMessage(message);
    if (dateStr) {
      result.departureDate = dateStr;
    }

    console.log('🎯 Basic pattern result:', result);
    return result;
  }

  /**
   * Parse simple "A to B on DATE" pattern
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseSimplePattern(message) {
    const match = message.match(this.patterns.simple);
    if (!match) return null;

    const origin = this.convertCityToCode(match[1]);
    const destination = this.convertCityToCode(match[2]);

    if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
      return null;
    }

    return {
      origin: origin,
      destination: destination,
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

    const origin = this.convertCityToCode(locationMatch[1].trim());
    const destination = this.convertCityToCode(locationMatch[2].trim());

    // Validate city codes
    if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
      return null;
    }

    const result = {
      origin: origin,
      destination: destination,
      adults: 1
    };

    // Extract date from the message
    const dateStr = locationMatch[3] || this.extractDateFromMessage(message);
    if (dateStr) {
      result.departureDate = this.parseDate(dateStr);
    }

    // Extract passenger count
    const passengerCount = this.extractPassengerCount(message);
    if (passengerCount > 1) {
      result.adults = passengerCount;
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
      this.patterns.need_flight
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const origin = this.convertCityToCode(match[1].trim());
        const destination = this.convertCityToCode(match[2].trim());

        if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
          continue;
        }

        return {
          origin: origin,
          destination: destination,
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

    // First, try to find multi-word city names
    const cityNames = Object.keys(this.cityToCode);
    for (const city of cityNames) {
      if (message.includes(city) && city.includes(' ')) {
        const code = this.cityToCode[city];
        if (code && !locations.includes(code)) {
          locations.push(code);
        }
      }
    }

    // Then try single words
    for (const word of words) {
      const code = this.convertCityToCode(word.trim());
      if (this.isValidCityCode(code) && !locations.includes(code)) {
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
   * Check if a city code is valid (3 letters and exists in our mapping)
   * @param {string} code - City code to validate
   * @returns {boolean} True if valid
   */
  isValidCityCode(code) {
    if (!code || typeof code !== 'string') return false;
    
    // Must be exactly 3 characters
    if (code.length !== 3) return false;
    
    // Must be in our city mapping (reverse lookup)
    const codeUpper = code.toUpperCase();
    return Object.values(this.cityToCode).includes(codeUpper) || 
           /^[A-Z]{3}$/.test(codeUpper); // Valid IATA format
  }

  /**
   * Extract date from message using various patterns
   * @param {string} message - Message to check
   * @returns {string|null} Formatted date or null
   */
  extractDateFromMessage(message) {
    console.log('🗓️ Extracting date from:', message);
    
    for (const pattern of this.dateFormats) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(message);
      if (match) {
        console.log('🎯 Date pattern matched:', match[1]);
        const parsedDate = this.parseDate(match[1]);
        if (parsedDate) {
          console.log('✅ Date parsed successfully:', parsedDate);
          return parsedDate;
        }
      }
    }
    
    console.log('❌ No date found in message');
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
   * Parse and format date string - ENHANCED
   * @param {string} dateStr - Date string to parse
   * @returns {string|null} Formatted date (YYYY-MM-DD) or null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    const cleanDate = dateStr.trim().toLowerCase();

    console.log('📅 Parsing date string:', dateStr);

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

    // Handle month name formats like "10 October 2025"
    const monthDateMatch = cleanDate.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/);
    if (monthDateMatch) {
      const day = monthDateMatch[1].padStart(2, '0');
      const month = this.monthNames[monthDateMatch[2]];
      const year = monthDateMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Handle "October 10 2025" format
    const dateMonthMatch = cleanDate.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/);
    if (dateMonthMatch) {
      const month = this.monthNames[dateMonthMatch[1]];
      const day = dateMonthMatch[2].padStart(2, '0');
      const year = dateMonthMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Handle abbreviated month formats
    const shortMonthMatch = cleanDate.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?/);
    if (shortMonthMatch) {
      const day = shortMonthMatch[1].padStart(2, '0');
      const month = this.monthNames[shortMonthMatch[2]];
      const year = shortMonthMatch[3] || new Date().getFullYear();
      return `${year}-${month}-${day}`;
    }

    // Try to parse standard date formats
    try {
      // Handle various formats
      let dateToTry = dateStr;
      
      // Convert DD/MM/YYYY to MM/DD/YYYY for proper parsing
      const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (ddmmyyyy) {
        dateToTry = `${ddmmyyyy[2]}/${ddmmyyyy[1]}/${ddmmyyyy[3]}`;
      }
      
      const parsedDate = new Date(dateToTry);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2020) {
        return this.formatDate(parsedDate);
      }
    } catch (error) {
      console.warn('Date parsing error:', error.message);
    }

    console.log('❌ Could not parse date:', dateStr);
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
   * Convert city name to IATA code - ENHANCED
   * @param {string} cityName - City name to convert
   * @returns {string} IATA code or original string
   */
  convertCityToCode(cityName) {
    if (!cityName) return '';
    
    const normalized = cityName.toLowerCase().trim();
    
    // Check if it's already a valid IATA code (3 letters)
    if (/^[a-z]{3}$/i.test(normalized)) {
      const upperCode = normalized.toUpperCase();
      // Verify it exists in our mapping
      if (Object.values(this.cityToCode).includes(upperCode)) {
        return upperCode;
      }
    }
    
    // Look up in our city mapping
    const code = this.cityToCode[normalized];
    if (code) {
      console.log(`🏙️ City converted: ${cityName} -> ${code}`);
      return code;
    }
    
    // Try partial matches for multi-word cities
    for (const [city, code] of Object.entries(this.cityToCode)) {
      if (city.includes(normalized) || normalized.includes(city)) {
        console.log(`🏙️ City partial match: ${cityName} -> ${code}`);
        return code;
      }
    }
    
    console.log(`❓ Unknown city: ${cityName}`);
    return cityName.toUpperCase();
  }

  /**
   * Calculate confidence score for parsed data
   * @param {Object} searchParams - Parsed search parameters
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(searchParams) {
    let score = 0;
    
    if (searchParams.origin && this.isValidCityCode(searchParams.origin)) score += 0.3;
    if (searchParams.destination && this.isValidCityCode(searchParams.destination)) score += 0.3;
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
        console.warn('⚠️ Departure date is in the past, adjusting...');
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
    
    if (!searchParams.origin || !this.isValidCityCode(searchParams.origin)) {
      suggestions.push('Please specify your departure city/airport (e.g., Mumbai, Delhi, BOM)');
    }
    
    if (!searchParams.destination || !this.isValidCityCode(searchParams.destination)) {
      suggestions.push('Please specify your destination city/airport (e.g., Delhi, Mumbai, DEL)');
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
      "Round trip Mumbai to Bangkok on 15th Jan return 25th Jan",
      "Delhi to Mumbai on 10 October 2025 for 2 passengers"
    ];
  }

  /**
   * Debug method to test parsing
   * @param {string} message - Message to test
   * @returns {Object} Debug information
   */
  debugParse(message) {
    console.log('🔍 === DEBUG PARSING ===');
    console.log('Original message:', message);
    
    const cleaned = this.cleanMessage(message);
    console.log('Cleaned message:', cleaned);
    
    const isFlightQuery = this.isFlightQuery(cleaned);
    console.log('Is flight query:', isFlightQuery);
    
    if (isFlightQuery) {
      const result = this.parseFlightQuery(message);
      console.log('Parse result:', result);
      
      if (result.confidence < 0.6) {
        console.log('Suggestions:', this.generateSuggestions(result));
      }
      
      return result;
    }
    
    return { error: 'Not recognized as flight query' };
  }
}

module.exports = new MessageParser();