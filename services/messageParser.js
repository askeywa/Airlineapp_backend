// Enhanced Message Parser Service with comprehensive debugging and testing
// services/messageParser.js

class MessageParser {
  constructor() {
    // Enhanced city-to-code mapping with more cities and aliases
    this.cityToCode = {
      // Major Indian Cities (with all variations)
      'mumbai': 'BOM', 'bombay': 'BOM', 'bom': 'BOM',
      'delhi': 'DEL', 'new delhi': 'DEL', 'del': 'DEL', 'newdelhi': 'DEL',
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
      'srinagar': 'SXR', 'sxr': 'SXR',
      'chandigarh': 'IXC', 'ixc': 'IXC',
      'nagpur': 'NAG', 'nag': 'NAG',
      'vadodara': 'BDQ', 'baroda': 'BDQ', 'bdq': 'BDQ',
      'rajkot': 'RAJ', 'raj': 'RAJ',
      'visakhapatnam': 'VTZ', 'vizag': 'VTZ', 'vtz': 'VTZ',
      'patna': 'PAT', 'pat': 'PAT',
      'raipur': 'RPR', 'rpr': 'RPR',
      'bhopal': 'BHO', 'bho': 'BHO',
      'agra': 'AGR', 'agr': 'AGR',
      'amritsar': 'ATQ', 'atq': 'ATQ',
      'guwahati': 'GAU', 'gau': 'GAU',
      'ranchi': 'IXR', 'ixr': 'IXR',
      'dehradun': 'DED', 'ded': 'DED',
      'jammu': 'IXJ', 'ixj': 'IXJ',
      'imphal': 'IMF', 'imf': 'IMF',
      'dibrugarh': 'DIB', 'dib': 'DIB',
      'bagdogra': 'IXB', 'ixb': 'IXB',
      'silchar': 'IXS', 'ixs': 'IXS',
      'mangalore': 'IXE', 'ixe': 'IXE',
      'calicut': 'CCJ', 'kozhikode': 'CCJ', 'ccj': 'CCJ',
      'madurai': 'IXM', 'ixm': 'IXM',
      'tirupati': 'TIR', 'tir': 'TIR',
      'vijayawada': 'VGA', 'vga': 'VGA',
      
      // International Cities (Popular destinations from India)
      'new york': 'JFK', 'nyc': 'JFK', 'new york city': 'JFK', 'newyork': 'JFK',
      'los angeles': 'LAX', 'la': 'LAX', 'lax': 'LAX', 'losangeles': 'LAX',
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
      'kuala lumpur': 'KUL', 'kl': 'KUL', 'kul': 'KUL', 'kualalumpur': 'KUL',
      'hong kong': 'HKG', 'hkg': 'HKG', 'hongkong': 'HKG',
      'abu dhabi': 'AUH', 'auh': 'AUH', 'abudhabi': 'AUH',
      'sharjah': 'SHJ', 'shj': 'SHJ',
      'muscat': 'MCT', 'mct': 'MCT',
      'kathmandu': 'KTM', 'ktm': 'KTM',
      'dhaka': 'DAC', 'dac': 'DAC',
      'colombo': 'CMB', 'cmb': 'CMB',
      'male': 'MLE', 'maldives': 'MLE', 'mle': 'MLE',
      'istanbul': 'IST', 'ist': 'IST',
      'rome': 'FCO', 'fco': 'FCO',
      'milan': 'MXP', 'mxp': 'MXP',
      'barcelona': 'BCN', 'bcn': 'BCN',
      'madrid': 'MAD', 'mad': 'MAD',
      'munich': 'MUC', 'muc': 'MUC',
      'vienna': 'VIE', 'vie': 'VIE',
      'brussels': 'BRU', 'bru': 'BRU',
      'copenhagen': 'CPH', 'cph': 'CPH',
      'stockholm': 'ARN', 'arn': 'ARN',
      'oslo': 'OSL', 'osl': 'OSL',
      'moscow': 'SVO', 'svo': 'SVO',
      'beijing': 'PEK', 'pek': 'PEK',
      'shanghai': 'PVG', 'pvg': 'PVG',
      'seoul': 'ICN', 'icn': 'ICN',
      'jakarta': 'CGK', 'cgk': 'CGK',
      'manila': 'MNL', 'mnl': 'MNL',
      'ho chi minh': 'SGN', 'sgn': 'SGN', 'saigon': 'SGN',
      'hanoi': 'HAN', 'han': 'HAN',
      'phnom penh': 'PNH', 'pnh': 'PNH',
      'yangon': 'RGN', 'rgn': 'RGN',
      'cairo': 'CAI', 'cai': 'CAI',
      'nairobi': 'NBO', 'nbo': 'NBO',
      'cape town': 'CPT', 'cpt': 'CPT', 'capetown': 'CPT',
      'johannesburg': 'JNB', 'jnb': 'JNB',
      'casablanca': 'CMN', 'cmn': 'CMN',
      'addis ababa': 'ADD', 'add': 'ADD', 'addisababa': 'ADD',
      
      // Popular airport codes (direct mapping)
      'jfk': 'JFK', 'lga': 'LGA', 'ewr': 'EWR',
      'heathrow': 'LHR', 'gatwick': 'LGW', 'lgw': 'LGW',
      'orly': 'ORY', 'charles de gaulle': 'CDG', 'charlesdegaulle': 'CDG',
      'narita': 'NRT', 'haneda': 'HND', 'hnd': 'HND',
      'changi': 'SIN', 'suvarnabhumi': 'BKK',
      'schiphol': 'AMS', 'pearson': 'YYZ'
    };

    // Enhanced date patterns with improved regex
    this.dateFormats = [
      // Standard formats
      /\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/g,
      /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g,
      
      // Natural language dates
      /\b(today|tomorrow)\b/gi,
      /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi,
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:\d{4})?)\b/gi,
      /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\s*(?:\d{4})?)\b/gi,
      
      // Full month names
      /\b(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})\b/gi,
      /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\s+\d{4})\b/gi,
      
      // Day/month patterns
      /\b(\d{1,2}[-\/]\d{1,2})\b/g,
      /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)\b/gi,
      
      // Relative dates
      /\b(day after tomorrow|next week|this weekend|coming weekend)\b/gi
    ];

    // Enhanced pattern matching with more variations
    this.patterns = {
      // Enhanced patterns for better matching with word boundaries
      from_to_on: /(?:\b(?:from|leaving|depart|departure)\s+)?(.+?)\s+(?:to|→|->|arriving|arrival)\s+(.+?)(?:\s+(?:on|date|departure|depart|leaving|travel)\s+(.+?))?(?:\s+(?:for|passengers?|adults?|pax|people)\s+(\d+))?/i,
      
      // Simple flight patterns
      flight_pattern: /(?:flight|fly|book|search|ticket|travel|trip|journey).*?(?:from\s+)?(.+?)\s+(?:to|→|->)\s+(.+?)(?:\s+(?:on|date)\s+(.+?))?/i,
      
      // Basic to pattern (most common)
      basic_to_pattern: /(.+?)\s+(?:to|→|->)\s+(.+?)(?:\s+(.+?))?$/i,
      
      // Need/want patterns
      need_flight: /(?:need|want|book|search|looking for|find).*?(?:flight|ticket).*?(?:from\s+)?(.+?)\s+(?:to|→|->)\s+(.+?)(?:\s+(?:on|date)\s+(.+?))?/i,
      
      // Travel patterns
      travel_pattern: /(?:travel|going|visit|trip|vacation|holiday).*?(?:from\s+)?(.+?)\s+(?:to|→|->)\s+(.+?)(?:\s+(?:on|date)\s+(.+?))?/i,
      
      // Passenger patterns with more variations
      passengers: /(?:for\s+(\d+)\s+(?:passengers?|people|adults?|pax|person))|(\d+)\s+(?:passengers?|people|adults?|pax|person)|(\d+)\s*(?:pax|px)/i,
      
      // Return flight patterns
      return_flight: /return\s+(?:on\s+|flight\s+|trip\s+|date\s+)?(.+?)(?:\s|$)/i,
      round_trip: /round\s*trip|return\s*journey|two\s*way|return\s*ticket|roundtrip/i,
      
      // Multi-city patterns
      multi_city: /(.+?)\s+(?:to|→|->)\s+(.+?)\s+(?:to|→|->)\s+(.+)/i
    };

    // Enhanced flight keywords
    this.flightKeywords = [
      'flight', 'flights', 'fly', 'book', 'search', 'ticket', 'tickets',
      'travel', 'trip', 'journey', 'airline', 'air', 'plane', 'aircraft',
      'departure', 'arrival', 'airport', 'booking', 'reservation',
      'vacation', 'holiday', 'visit', 'going', 'need', 'want', 'from', 'to',
      'itinerary', 'schedule', 'boarding', 'check-in', 'baggage',
      'domestic', 'international', 'connecting', 'direct', 'nonstop'
    ];

    // Month name mappings
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

    // Statistics tracking
    this.parseCount = 0;
    this.successfulParseCount = 0;
    this.averageConfidence = 0;
    
    console.log('✅ Message Parser initialized with enhanced capabilities');
    console.log(`📊 City database: ${Object.keys(this.cityToCode).length} cities/codes`);
  }

  /**
   * Main parsing function - analyzes message and extracts flight search parameters
   * @param {string} message - User message to parse
   * @returns {Object} Parsed flight search parameters
   */
  parseFlightQuery(message) {
    const parseStartTime = Date.now();
    this.parseCount++;
    
    try {
      if (!message || typeof message !== 'string') {
        console.log('❌ Invalid message input:', message);
        return this.getDefaultSearchParams('invalid_input');
      }

      const cleanMessage = this.cleanMessage(message);
      console.log('🔍 ===== MESSAGE PARSING ANALYSIS =====');
      console.log('📝 Original message:', message);
      console.log('🧹 Cleaned message:', cleanMessage);
      console.log('📊 Message stats:', {
        originalLength: message.length,
        cleanedLength: cleanMessage.length,
        wordCount: cleanMessage.split(/\s+/).length
      });

      // Initialize default search parameters
      const searchParams = this.getDefaultSearchParams();
      searchParams.originalMessage = message;
      searchParams.cleanedMessage = cleanMessage;
      searchParams.messageType = this.identifyMessageType(cleanMessage);

      // Early return if not a flight query
      if (!this.isFlightQuery(cleanMessage)) {
        console.log('❌ Not identified as flight query');
        console.log('🔍 Flight query analysis failed');
        return searchParams;
      }

      console.log('✅ Identified as flight query');
      console.log('🚀 Proceeding with detailed parsing...');

      // Try different parsing approaches
      const parsedData = this.tryMultiplePatterns(cleanMessage);
      
      if (parsedData && parsedData.origin && parsedData.destination) {
        Object.assign(searchParams, parsedData);
        searchParams.confidence = this.calculateConfidence(searchParams);
        this.successfulParseCount++;
        console.log('✅ Successfully parsed with confidence:', searchParams.confidence.toFixed(3));
      } else {
        console.log('❌ No patterns matched successfully');
        // Try fallback parsing
        const fallbackData = this.fallbackParsing(cleanMessage);
        if (fallbackData) {
          Object.assign(searchParams, fallbackData);
          searchParams.confidence = Math.max(0.3, this.calculateConfidence(searchParams));
          console.log('⚠️ Fallback parsing succeeded with confidence:', searchParams.confidence.toFixed(3));
        }
      }

      // Validate and format the results
      this.validateAndFormat(searchParams);

      // Update statistics
      this.updateStatistics(searchParams);

      const parseTime = Date.now() - parseStartTime;
      console.log('📊 Final parsing result:', {
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        adults: searchParams.adults,
        confidence: searchParams.confidence.toFixed(3),
        parseTime: `${parseTime}ms`
      });

      return searchParams;
    } catch (error) {
      console.error('❌ Error in parseFlightQuery:', error);
      console.error('📍 Error details:', {
        message: error.message,
        stack: error.stack,
        originalMessage: message
      });
      return this.getDefaultSearchParams('parse_error', error);
    }
  }

  /**
   * Get default search parameters with enhanced tracking
   * @param {string} reason - Reason for default params
   * @param {Error} error - Error if applicable
   * @returns {Object} Default search parameters
   */
  getDefaultSearchParams(reason = 'normal', error = null) {
    const params = {
      origin: null,
      destination: null,
      departureDate: null,
      returnDate: null,
      adults: 1,
      isRoundTrip: false,
      confidence: 0,
      messageType: 'general',
      parseReason: reason,
      parseTimestamp: new Date().toISOString()
    };

    if (error) {
      params.parseError = {
        message: error.message,
        name: error.name
      };
    }

    return params;
  }

  /**
   * Enhanced message cleaning with better normalization
   * @param {string} message - Raw message
   * @returns {string} Cleaned message
   */
  cleanMessage(message) {
    if (!message) return '';
    
    console.log('🧹 Cleaning message...');
    
    let cleaned = message
      .toLowerCase()
      .trim()
      // Replace arrow symbols and common separators
      .replace(/[→→]/g, ' to ')
      .replace(/[-–—]/g, ' to ')
      .replace(/\s*->\s*/g, ' to ')
      // Remove extra punctuation but keep essential ones
      .replace(/[^\w\s\-\/.,]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove common filler words that don't add value
      .replace(/\b(please|pls|can you|could you|i want|i need|help me|hi|hello|hey|good morning|good afternoon|good evening)\b/g, '')
      // Clean up extra spaces
      .trim();

    console.log('🧹 Cleaning steps:', {
      original: message.length,
      afterArrows: cleaned.length,
      afterFillers: cleaned.length
    });

    return cleaned;
  }

  /**
   * Enhanced message type identification
   * @param {string} message - Cleaned message
   * @returns {string} Message type
   */
  identifyMessageType(message) {
    console.log('🏷️ Identifying message type...');
    
    const typePatterns = {
      'help': /\b(help|how|what|explain|guide|instructions|commands)\b/,
      'support': /\b(cancel|refund|problem|issue|complaint|support)\b/,
      'status': /\b(status|check|confirm|booking|reservation|pnr)\b/,
      'greeting': /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/,
      'flight_search': this.isFlightQuery(message)
    };

    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (type === 'flight_search') {
        if (pattern) return type;
      } else if (pattern.test(message)) {
        console.log(`🏷️ Identified as: ${type}`);
        return type;
      }
    }
    
    console.log('🏷️ Identified as: general');
    return 'general';
  }

  /**
   * Enhanced flight query detection with comprehensive analysis
   * @param {string} message - Message to check
   * @returns {boolean} True if flight related
   */
  isFlightQuery(message) {
    console.log('🔍 ===== FLIGHT QUERY DETECTION =====');
    
    // Check for flight keywords
    const hasKeyword = this.flightKeywords.some(keyword => 
      message.includes(keyword)
    );
    
    // Check for location patterns
    const hasToPattern = /\s+to\s+/.test(message) || /→/.test(message) || /->/.test(message);
    const hasFromPattern = /\s+from\s+/.test(message);
    const hasLocationPattern = hasToPattern || hasFromPattern;
    
    // Check for known city names/codes
    const cityMatches = this.countCityMatches(message);
    const hasCityNames = cityMatches.count >= 1;
    
    // Check for date patterns
    const hasDatePattern = this.dateFormats.some(pattern => {
      pattern.lastIndex = 0; // Reset regex
      return pattern.test(message);
    });
    
    // Check for passenger patterns
    const hasPassengerPattern = /\d+\s*(?:passenger|people|adult|pax|person)/.test(message);
    
    // Enhanced decision logic with scoring
    let score = 0;
    if (hasKeyword) score += 3;
    if (hasLocationPattern) score += 3;
    if (hasCityNames && cityMatches.count >= 2) score += 4;
    else if (hasCityNames) score += 2;
    if (hasDatePattern) score += 2;
    if (hasPassengerPattern) score += 1;
    
    const isFlightQuery = score >= 4;
    
    console.log('🔍 Flight query analysis:', {
      hasKeyword,
      hasLocationPattern,
      cityMatches: cityMatches.count,
      cityNames: cityMatches.cities,
      hasDatePattern,
      hasPassengerPattern,
      score,
      threshold: 4,
      decision: isFlightQuery
    });
    
    return isFlightQuery;
  }

  /**
   * Count and identify city matches in message
   * @param {string} message - Message to analyze
   * @returns {Object} City match results
   */
  countCityMatches(message) {
    const matches = {
      count: 0,
      cities: [],
      codes: []
    };
    
    // Sort cities by length (longest first) to match multi-word cities first
    const sortedCities = Object.keys(this.cityToCode).sort((a, b) => b.length - a.length);
    
    for (const city of sortedCities) {
      if (message.includes(city)) {
        const code = this.cityToCode[city];
        if (!matches.codes.includes(code)) { // Avoid duplicates
          matches.count++;
          matches.cities.push(city);
          matches.codes.push(code);
        }
      }
    }
    
    return matches;
  }

  /**
   * Try multiple parsing patterns with enhanced logging
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data or null
   */
  tryMultiplePatterns(message) {
    console.log('🎯 ===== TRYING MULTIPLE PATTERNS =====');
    
    const patterns = [
      { func: this.parseFromToPattern.bind(this), name: 'from_to_pattern', priority: 1 },
      { func: this.parseBasicToPattern.bind(this), name: 'basic_to_pattern', priority: 2 },
      { func: this.parseFlightRequestPattern.bind(this), name: 'flight_request_pattern', priority: 3 },
      { func: this.parseLocationOnlyPattern.bind(this), name: 'location_only_pattern', priority: 4 },
      { func: this.parseMultiCityPattern.bind(this), name: 'multi_city_pattern', priority: 5 }
    ];

    // Sort by priority
    patterns.sort((a, b) => a.priority - b.priority);

    for (const pattern of patterns) {
      console.log(`🧪 Testing pattern: ${pattern.name} (Priority: ${pattern.priority})`);
      try {
        const startTime = Date.now();
        const result = pattern.func(message);
        const processingTime = Date.now() - startTime;
        
        if (result && result.origin && result.destination) {
          console.log(`✅ Pattern matched: ${pattern.name}`, {
            result,
            processingTime: `${processingTime}ms`
          });
          result.patternUsed = pattern.name;
          result.patternPriority = pattern.priority;
          return result;
        } else if (result) {
          console.log(`⚠️ Partial match: ${pattern.name}`, {
            result,
            processingTime: `${processingTime}ms`
          });
        } else {
          console.log(`❌ No match: ${pattern.name} (${processingTime}ms)`);
        }
      } catch (error) {
        console.error(`❌ Error in pattern ${pattern.name}:`, error.message);
      }
    }

    console.log('❌ No patterns matched successfully');
    return null;
  }

  /**
   * Enhanced basic "X to Y" pattern parsing
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseBasicToPattern(message) {
    const match = message.match(this.patterns.basic_to_pattern);
    if (!match) return null;

    console.log('🎯 Basic pattern match:', match);

    // Extract potential origin and destination
    let originStr = match[1].trim();
    let destinationStr = match[2].trim();
    
    console.log('📍 Raw location strings:', { originStr, destinationStr });

    // Handle cases where date/passengers might be mixed in
    const words1 = originStr.split(/\s+/);
    const words2 = destinationStr.split(/\s+/);
    
    // Try to find city in the words
    let origin = null, destination = null;
    
    // For origin, try different word combinations
    origin = this.findBestCityMatch(words1, 'origin');
    
    // For destination, try different word combinations  
    destination = this.findBestCityMatch(words2, 'destination');

    console.log('🏙️ City extraction results:', { origin, destination });

    if (!origin || !destination) {
      console.log('❌ Could not extract both cities');
      return null;
    }

    const result = {
      origin: origin,
      destination: destination,
      adults: this.extractPassengerCount(message)
    };

    // Extract date from the full message
    const dateStr = this.extractDateFromMessage(message);
    if (dateStr) {
      result.departureDate = dateStr;
    }

    console.log('🎯 Basic pattern result:', result);
    return result;
  }

  /**
   * Find best city match from word array
   * @param {Array} words - Array of words
   * @param {string} context - Context for logging
   * @returns {string|null} Best matching city code
   */
  findBestCityMatch(words, context) {
    console.log(`🔍 Finding city match for ${context}:`, words);
    
    // Try multi-word combinations first (up to 3 words)
    for (let len = Math.min(3, words.length); len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        const code = this.convertCityToCode(phrase);
        if (this.isValidCityCode(code)) {
          console.log(`✅ Multi-word match for ${context}: "${phrase}" → ${code}`);
          return code;
        }
      }
    }
    
    // Try individual words
    for (const word of words) {
      const code = this.convertCityToCode(word);
      if (this.isValidCityCode(code)) {
        console.log(`✅ Single word match for ${context}: "${word}" → ${code}`);
        return code;
      }
    }
    
    console.log(`❌ No city match found for ${context}`);
    return null;
  }

  /**
   * Parse "from X to Y" pattern with enhanced extraction
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseFromToPattern(message) {
    console.log('🔍 Parsing from-to pattern...');
    
    let match = message.match(this.patterns.from_to_on);
    
    if (!match) {
      match = message.match(this.patterns.flight_pattern);
    }
    
    if (!match) {
      console.log('❌ No from-to pattern match');
      return null;
    }

    console.log('🎯 From-to pattern match:', match);

    const originStr = match[1] ? match[1].trim() : '';
    const destinationStr = match[2] ? match[2].trim() : '';

    console.log('📍 Extracted strings:', { originStr, destinationStr });

    const origin = this.extractCityFromString(originStr);
    const destination = this.extractCityFromString(destinationStr);

    if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
      console.log('❌ Invalid city codes:', { origin, destination });
      return null;
    }

    const result = {
      origin: origin,
      destination: destination,
      adults: this.extractPassengerCount(message)
    };

    // Extract date
    const dateStr = match[3] || this.extractDateFromMessage(message);
    if (dateStr) {
      result.departureDate = this.parseDate(dateStr);
    }

    // Extract passenger count from match or message
    const passengerCount = match[4] ? parseInt(match[4]) : this.extractPassengerCount(message);
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

    console.log('✅ From-to pattern result:', result);
    return result;
  }

  /**
   * Parse multi-city patterns (A to B to C)
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseMultiCityPattern(message) {
    console.log('🔍 Parsing multi-city pattern...');
    
    const match = message.match(this.patterns.multi_city);
    if (!match) {
      console.log('❌ No multi-city pattern match');
      return null;
    }

    console.log('🎯 Multi-city pattern match:', match);

    // For now, just handle first two cities (most common case)
    const origin = this.extractCityFromString(match[1]);
    const destination = this.extractCityFromString(match[2]);
    // Could extend to handle match[3] for multi-city trips

    if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
      console.log('❌ Invalid multi-city codes:', { origin, destination });
      return null;
    }

    const result = {
      origin: origin,
      destination: destination,
      adults: this.extractPassengerCount(message),
      isMultiCity: true,
      departureDate: this.extractDateFromMessage(message)
    };

    console.log('✅ Multi-city pattern result:', result);
    return result;
  }

  /**
   * Enhanced fallback parsing when main patterns fail
   * @param {string} message - Cleaned message
   * @returns {Object|null} Parsed data or null
   */
  fallbackParsing(message) {
    console.log('🔄 ===== ATTEMPTING FALLBACK PARSING =====');
    
    // Extract all potential city names/codes
    const locations = this.extractAllLocations(message);
    console.log('📍 All extracted locations:', locations);
    
    if (locations.length >= 2) {
      const result = {
        origin: locations[0],
        destination: locations[1],
        departureDate: this.extractDateFromMessage(message),
        adults: this.extractPassengerCount(message),
        fallbackParsing: true
      };
      
      console.log('✅ Fallback parsing successful:', result);
      return result;
    }
    
    // Try splitting by common separators
    const separators = [' to ', ' -> ', ' → ', ' - ', ' and '];
    for (const sep of separators) {
      if (message.includes(sep)) {
        const parts = message.split(sep);
        if (parts.length >= 2) {
          const origin = this.findBestCityInText(parts[0]);
          const destination = this.findBestCityInText(parts[1]);
          
          if (this.isValidCityCode(origin) && this.isValidCityCode(destination)) {
            const result = {
              origin,
              destination,
              departureDate: this.extractDateFromMessage(message),
              adults: this.extractPassengerCount(message),
              fallbackParsing: true,
              separator: sep
            };
            
            console.log('✅ Separator-based fallback successful:', result);
            return result;
          }
        }
      }
    }
    
    console.log('❌ Fallback parsing failed');
    return null;
  }

  /**
   * Find best city match in a text string
   * @param {string} text - Text to search
   * @returns {string|null} City code or null
   */
  findBestCityInText(text) {
    const words = text.trim().split(/\s+/);
    
    // Try different word combinations
    for (let len = Math.min(3, words.length); len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        const code = this.convertCityToCode(phrase);
        if (this.isValidCityCode(code)) {
          return code;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract all possible locations from message
   * @param {string} message - Message to analyze
   * @returns {Array} Array of valid city codes
   */
  extractAllLocations(message) {
    console.log('📍 Extracting all locations from:', message);
    
    const locations = [];
    const words = message.split(/\s+/);
    
    // Check for multi-word city names first (sorted by length, longest first)
    const cityNames = Object.keys(this.cityToCode).sort((a, b) => b.length - a.length);
    
    for (const city of cityNames) {
      if (message.includes(city) && city.includes(' ')) {
        const code = this.cityToCode[city];
        if (code && !locations.includes(code)) {
          locations.push(code);
          console.log(`🏙️ Multi-word city found: "${city}" → ${code}`);
        }
      }
    }
    
    // Then check individual words and remaining combinations
    for (let len = Math.min(3, words.length); len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        const cleanPhrase = phrase.toLowerCase().replace(/[^\w\s]/g, '');
        const code = this.convertCityToCode(cleanPhrase);
        
        if (this.isValidCityCode(code) && !locations.includes(code)) {
          locations.push(code);
          console.log(`🏙️ Location found: "${phrase}" → ${code}`);
        }
      }
    }
    
    console.log('📊 Total locations found:', locations);
    return locations;
  }

  /**
   * Parse travel/flight request patterns
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseFlightRequestPattern(message) {
    console.log('🔍 Parsing flight request patterns...');
    
    const patterns = [
      this.patterns.travel_pattern,
      this.patterns.need_flight
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        console.log('🎯 Flight request pattern match:', match);
        
        const origin = this.extractCityFromString(match[1]);
        const destination = this.extractCityFromString(match[2]);

        if (!this.isValidCityCode(origin) || !this.isValidCityCode(destination)) {
          console.log('❌ Invalid cities in flight request pattern');
          continue;
        }

        const result = {
          origin: origin,
          destination: destination,
          departureDate: match[3] ? this.parseDate(match[3]) : this.extractDateFromMessage(message),
          adults: this.extractPassengerCount(message)
        };
        
        console.log('✅ Flight request pattern result:', result);
        return result;
      }
    }

    console.log('❌ No flight request patterns matched');
    return null;
  }

  /**
   * Parse location-only patterns
   * @param {string} message - Message to parse
   * @returns {Object|null} Parsed data
   */
  parseLocationOnlyPattern(message) {
    console.log('🔍 Parsing location-only patterns...');
    
    const locations = this.extractAllLocations(message);

    if (locations.length >= 2) {
      const result = {
        origin: locations[0],
        destination: locations[1],
        departureDate: this.extractDateFromMessage(message),
        adults: this.extractPassengerCount(message),
        locationOnlyParsing: true
      };
      
      console.log('✅ Location-only pattern result:', result);
      return result;
    }

    console.log('❌ Insufficient locations for location-only pattern');
    return null;
  }

  /**
   * Extract city code from a string that might contain multiple words
   * @param {string} str - String to extract city from
   * @returns {string|null} City code or null
   */
  extractCityFromString(str) {
    if (!str) return null;
    
    console.log('🏙️ Extracting city from string:', str);
    
    // Try the full string first
    let code = this.convertCityToCode(str);
    if (this.isValidCityCode(code)) {
      console.log(`✅ Full string match: "${str}" → ${code}`);
      return code;
    }
    
    // Try word combinations (longest first)
    const words = str.split(/\s+/);
    for (let len = Math.min(3, words.length); len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        code = this.convertCityToCode(phrase);
        if (this.isValidCityCode(code)) {
          console.log(`✅ Phrase match: "${phrase}" → ${code}`);
          return code;
        }
      }
    }
    
    console.log(`❌ No city found in: "${str}"`);
    return null;
  }

  /**
   * Enhanced city code validation
   * @param {string} code - City code to validate
   * @returns {boolean} True if valid
   */
  isValidCityCode(code) {
    if (!code || typeof code !== 'string') return false;
    
    const codeUpper = code.toUpperCase();
    
    // Must be exactly 3 characters
    if (codeUpper.length !== 3) return false;
    
    // Must follow IATA format (3 letters)
    if (!/^[A-Z]{3}$/.test(codeUpper)) return false;
    
    // Must be in our city mapping
    const isValid = Object.values(this.cityToCode).includes(codeUpper);
    
    if (isValid) {
      console.log(`✅ Valid city code: ${codeUpper}`);
    } else {
      console.log(`❌ Invalid city code: ${codeUpper}`);
    }
    
    return isValid;
  }

  /**
   * Enhanced date extraction with comprehensive patterns
   * @param {string} message - Message to check
   * @returns {string|null} Formatted date or null
   */
  extractDateFromMessage(message) {
    console.log('🗓️ ===== DATE EXTRACTION =====');
    console.log('📅 Extracting date from:', message);
    
    for (let i = 0; i < this.dateFormats.length; i++) {
      const pattern = this.dateFormats[i];
      pattern.lastIndex = 0; // Reset regex state
      
      const match = pattern.exec(message);
      if (match) {
        console.log(`🎯 Date pattern ${i + 1} matched:`, match[1]);
        const parsedDate = this.parseDate(match[1]);
        if (parsedDate) {
          console.log('✅ Date parsed successfully:', parsedDate);
          return parsedDate;
        } else {
          console.log('❌ Date parsing failed for match:', match[1]);
        }
      }
    }
    
    // Try extracting standalone numbers that might be dates
    const numberMatches = message.match(/\b(\d{1,2})\b/g);
    if (numberMatches) {
      console.log('🔢 Found numbers:', numberMatches);
      for (const num of numberMatches) {
        const dayNum = parseInt(num);
        if (dayNum >= 1 && dayNum <= 31) {
          // Try to construct a date for current/next month
          const today = new Date();
          const thisMonth = new Date(today.getFullYear(), today.getMonth(), dayNum);
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dayNum);
          
          if (thisMonth >= today) {
            const dateStr = this.formatDate(thisMonth);
            console.log(`✅ Inferred date from day ${dayNum}:`, dateStr);
            return dateStr;
          } else if (nextMonth) {
            const dateStr = this.formatDate(nextMonth);
            console.log(`✅ Inferred date from day ${dayNum} (next month):`, dateStr);
            return dateStr;
          }
        }
      }
    }
    
    console.log('❌ No date found in message');
    return null;
  }

  /**
   * Enhanced passenger count extraction
   * @param {string} message - Message to check
   * @returns {number} Number of passengers
   */
  extractPassengerCount(message) {
    console.log('👥 Extracting passenger count from:', message);
    
    const match = message.match(this.patterns.passengers);
    if (match) {
      const count = parseInt(match[1] || match[2] || match[3]);
      const validCount = Math.max(1, Math.min(9, count));
      console.log(`👥 Found passengers: ${count} → normalized to: ${validCount}`);
      return validCount;
    }
    
    // Look for standalone numbers that might indicate passengers
    const numbers = message.match(/\b(\d+)\b/g);
    if (numbers) {
      for (const num of numbers) {
        const count = parseInt(num);
        if (count >= 2 && count <= 9) {
          console.log(`👥 Inferred passengers from number: ${count}`);
          return count;
        }
      }
    }
    
    console.log('👥 Using default passenger count: 1');
    return 1;
  }

  /**
   * Enhanced date parsing with multiple format support
   * @param {string} dateStr - Date string to parse
   * @returns {string|null} Formatted date (YYYY-MM-DD) or null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    const cleanDate = dateStr.trim().toLowerCase();

    console.log('📅 ===== DATE PARSING =====');
    console.log('📅 Input date string:', dateStr);
    console.log('🧹 Cleaned date string:', cleanDate);

    try {
      // Handle relative dates
      if (cleanDate === 'today') {
        return this.formatDate(today);
      }
      
      if (cleanDate === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return this.formatDate(tomorrow);
      }

      if (cleanDate === 'day after tomorrow') {
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);
        return this.formatDate(dayAfter);
      }

      // Handle next weekday
      const nextDayMatch = cleanDate.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
      if (nextDayMatch) {
        const targetDay = nextDayMatch[1];
        const date = this.getNextWeekday(today, targetDay);
        return this.formatDate(date);
      }

      // Handle "this weekend" or "next week"
      if (cleanDate.includes('weekend') || cleanDate.includes('next week')) {
        const nextSaturday = this.getNextWeekday(today, 'saturday');
        return this.formatDate(nextSaturday);
      }

      // Handle various date formats with enhanced patterns
      const dateFormats = [
        // DD Month YYYY
        {
          pattern: /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
          parse: (match) => ({ day: match[1], month: this.monthNames[match[2].toLowerCase()], year: match[3] })
        },
        // Month DD YYYY
        {
          pattern: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/i,
          parse: (match) => ({ month: this.monthNames[match[1].toLowerCase()], day: match[2], year: match[3] })
        },
        // DD Mon YYYY
        {
          pattern: /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?/i,
          parse: (match) => ({ day: match[1], month: this.monthNames[match[2].toLowerCase()], year: match[3] || new Date().getFullYear() })
        },
        // Mon DD YYYY
        {
          pattern: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})?/i,
          parse: (match) => ({ month: this.monthNames[match[1].toLowerCase()], day: match[2], year: match[3] || new Date().getFullYear() })
        }
      ];

      for (const format of dateFormats) {
        const match = cleanDate.match(format.pattern);
        if (match) {
          const parsed = format.parse(match);
          if (parsed.month) {
            const result = `${parsed.year}-${parsed.month.padStart(2, '0')}-${parsed.day.padStart(2, '0')}`;
            
            // Validate the constructed date
            const testDate = new Date(result);
            if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= new Date().getFullYear()) {
              console.log('✅ Date parsed from month format:', result);
              return result;
            }
          }
        }
      }

      // Handle standard date formats
      const standardFormats = [
        {
          pattern: /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
          parse: (match) => ({ year: match[1], month: match[2], day: match[3] })
        },
        {
          pattern: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
          parse: (match) => ({ day: match[1], month: match[2], year: match[3] }) // Assuming DD-MM-YYYY
        },
        {
          pattern: /^(\d{1,2})[\/\-](\d{1,2})$/,
          parse: (match) => ({ day: match[1], month: match[2], year: new Date().getFullYear() })
        }
      ];

      for (const format of standardFormats) {
        const match = dateStr.match(format.pattern);
        if (match) {
          const parsed = format.parse(match);
          const result = `${parsed.year}-${parsed.month.padStart(2, '0')}-${parsed.day.padStart(2, '0')}`;
          
          // Validate the date
          const testDate = new Date(result);
          if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 2020) {
            console.log('✅ Date parsed from standard format:', result);
            return result;
          }
        }
      }

      // Try JavaScript Date parsing as last resort
      const jsDate = new Date(dateStr);
      if (!isNaN(jsDate.getTime()) && jsDate.getFullYear() >= 2020) {
        const result = this.formatDate(jsDate);
        console.log('✅ Date parsed using JavaScript Date:', result);
        return result;
      }

    } catch (error) {
      console.warn('⚠️ Date parsing error:', error.message);
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
      daysToAdd += 7;
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
   * Enhanced city name to IATA code conversion
   * @param {string} cityName - City name to convert
   * @returns {string} IATA code or original string
   */
  convertCityToCode(cityName) {
    if (!cityName) return '';
    
    const normalized = cityName.toLowerCase().trim();
    
    // Check if it's already a valid IATA code
    if (/^[a-z]{3}$/i.test(normalized)) {
      const upperCode = normalized.toUpperCase();
      if (Object.values(this.cityToCode).includes(upperCode)) {
        console.log(`✅ Already valid IATA code: ${cityName} → ${upperCode}`);
        return upperCode;
      }
    }
    
    // Direct lookup in mapping
    if (this.cityToCode[normalized]) {
      console.log(`🏙️ Direct city match: ${cityName} → ${this.cityToCode[normalized]}`);
      return this.cityToCode[normalized];
    }
    
    // Try partial matches for multi-word cities
    for (const [city, code] of Object.entries(this.cityToCode)) {
      if (city.includes(normalized) || normalized.includes(city)) {
        console.log(`🏙️ Partial city match: ${cityName} → ${code} (via ${city})`);
        return code;
      }
    }
    
    // Try removing common suffixes and prefixes
    const cleanedCity = normalized
      .replace(/^(new|old|greater|metro|city of)\s+/, '')
      .replace(/\s+(airport|city|international|metro|area)$/, '');
    
    if (cleanedCity !== normalized && this.cityToCode[cleanedCity]) {
      console.log(`🏙️ Cleaned city match: ${cityName} → ${this.cityToCode[cleanedCity]} (cleaned: ${cleanedCity})`);
      return this.cityToCode[cleanedCity];
    }
    
    console.log(`❓ Unknown city: ${cityName}`);
    return cityName.toUpperCase();
  }

  /**
   * Calculate confidence score based on extracted information
   * @param {Object} searchParams - Parsed search parameters
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(searchParams) {
    let score = 0;
    let maxScore = 1.0;
    
    // Base scoring
    if (searchParams.origin && this.isValidCityCode(searchParams.origin)) score += 0.35;
    if (searchParams.destination && this.isValidCityCode(searchParams.destination)) score += 0.35;
    if (searchParams.departureDate) score += 0.15;
    if (searchParams.adults > 0) score += 0.05;
    
    // Bonus scoring
    if (searchParams.isRoundTrip && searchParams.returnDate) score += 0.05;
    if (searchParams.patternUsed && searchParams.patternPriority <= 2) score += 0.05;
    
    // Penalty for fallback methods
    if (searchParams.fallbackParsing) score *= 0.8;
    if (searchParams.locationOnlyParsing) score *= 0.9;
    
    const finalScore = Math.min(maxScore, Math.max(0, score));
    
    console.log('📊 Confidence calculation:', {
      origin: !!searchParams.origin,
      destination: !!searchParams.destination,
      date: !!searchParams.departureDate,
      adults: searchParams.adults,
      rawScore: score,
      finalScore: finalScore
    });
    
    return finalScore;
  }

  /**
   * Validate and format search parameters
   * @param {Object} searchParams - Parameters to validate
   */
  validateAndFormat(searchParams) {
    console.log('🔍 ===== VALIDATING AND FORMATTING =====');
    
    // Ensure IATA codes are uppercase and 3 characters
    if (searchParams.origin) {
      const oldOrigin = searchParams.origin;
      searchParams.origin = searchParams.origin.toUpperCase().substring(0, 3);
      if (oldOrigin !== searchParams.origin) {
        console.log(`📍 Origin formatted: ${oldOrigin} → ${searchParams.origin}`);
      }
    }
    
    if (searchParams.destination) {
      const oldDestination = searchParams.destination;
      searchParams.destination = searchParams.destination.toUpperCase().substring(0, 3);
      if (oldDestination !== searchParams.destination) {
        console.log(`📍 Destination formatted: ${oldDestination} → ${searchParams.destination}`);
      }
    }
    
    // Validate passenger count
    if (searchParams.adults) {
      const oldAdults = searchParams.adults;
      searchParams.adults = Math.max(1, Math.min(9, parseInt(searchParams.adults) || 1));
      if (oldAdults !== searchParams.adults) {
        console.log(`👥 Adults count adjusted: ${oldAdults} → ${searchParams.adults}`);
      }
    }
    
    // Validate dates
    if (searchParams.departureDate) {
      const depDate = new Date(searchParams.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (depDate < today) {
        console.warn('⚠️ Departure date is in the past, adjusting to today...');
        searchParams.departureDate = this.formatDate(today);
        searchParams.dateAdjusted = true;
      }
    }
    
    if (searchParams.returnDate) {
      const returnDate = new Date(searchParams.returnDate);
      const depDate = new Date(searchParams.departureDate);
      
      if (returnDate <= depDate) {
        console.warn('⚠️ Return date is before or same as departure date');
        // Adjust return date to be at least 1 day after departure
        const adjustedReturn = new Date(depDate);
        adjustedReturn.setDate(depDate.getDate() + 1);
        searchParams.returnDate = this.formatDate(adjustedReturn);
        searchParams.returnDateAdjusted = true;
      }
    }
    
    // Ensure origin and destination are different
    if (searchParams.origin && searchParams.destination && 
        searchParams.origin === searchParams.destination) {
      console.warn('⚠️ Origin and destination are the same, clearing destination');
      searchParams.destination = null;
      searchParams.confidence = Math.max(0, searchParams.confidence - 0.3);
      searchParams.sameOriginDestination = true;
    }
    
    console.log('✅ Validation and formatting completed');
  }

  /**
   * Update parser statistics
   * @param {Object} searchParams - Search parameters with confidence
   */
  updateStatistics(searchParams) {
    if (searchParams.confidence > 0.5) {
      this.successfulParseCount++;
    }
    
    // Calculate rolling average confidence
    this.averageConfidence = ((this.averageConfidence * (this.parseCount - 1)) + searchParams.confidence) / this.parseCount;
  }

  /**
   * Generate suggestions for improving the query
   * @param {Object} searchParams - Current search parameters
   * @returns {Array} Array of suggestions
   */
  generateSuggestions(searchParams) {
    const suggestions = [];
    
    if (!searchParams.origin || !this.isValidCityCode(searchParams.origin)) {
      suggestions.push('Please specify your departure city (e.g., Mumbai, Delhi, BOM)');
    }
    
    if (!searchParams.destination || !this.isValidCityCode(searchParams.destination)) {
      suggestions.push('Please specify your destination city (e.g., Delhi, Mumbai, DEL)');
    }
    
    if (!searchParams.departureDate) {
      suggestions.push('Please specify your travel date (e.g., "tomorrow", "25th Dec", "2025-01-15")');
    }
    
    if (searchParams.sameOriginDestination) {
      suggestions.push('Your departure and destination cities are the same. Please specify different cities');
    }
    
    if (suggestions.length === 0 && searchParams.confidence < 0.7) {
      suggestions.push('Please provide more specific details about your flight search');
    }
    
    return suggestions;
  }

  /**
   * Get example query formats
   * @returns {Array} Array of example queries
   */
  getExampleQueries() {
    return [
      "Mumbai to Delhi tomorrow",
      "Flight from BOM to DEL on 25th December for 2 passengers",
      "Need tickets from NYC to London on 2025-01-15",
      "Travel Delhi to Dubai next Monday",
      "Book flight Mumbai to Singapore on Jan 20th",
      "Round trip Mumbai to Bangkok on 15th Jan return 25th Jan",
      "Delhi to Mumbai on 10 October 2025 for 2 passengers",
      "BLR → DEL tomorrow 2 pax",
      "Going from Chennai to Kolkata on 25 Dec",
      "I want to fly from Bangalore to Hyderabad next Friday",
      "Flight search: Pune to Goa this weekend",
      "Book return tickets Mumbai Delhi Jan 15 return Jan 20"
    ];
  }

  /**
   * Get parser statistics
   * @returns {Object} Parser statistics
   */
  getStatistics() {
    return {
      totalParses: this.parseCount,
      successfulParses: this.successfulParseCount,
      successRate: this.parseCount > 0 ? (this.successfulParseCount / this.parseCount) : 0,
      averageConfidence: this.averageConfidence,
      cityDatabaseSize: Object.keys(this.cityToCode).length,
      dateFormatsSupported: this.dateFormats.length,
      patternsSupported: Object.keys(this.patterns).length
    };
  }

  /**
   * Reset parser statistics
   */
  resetStatistics() {
    this.parseCount = 0;
    this.successfulParseCount = 0;
    this.averageConfidence = 0;
    console.log('📊 Parser statistics reset');
  }

  /**
   * Debug method to test parsing with detailed output
   * @param {string} message - Message to test
   * @returns {Object} Debug information
   */
  debugParse(message) {
    console.log('🧪 ===== DEBUG PARSING =====');
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
      
      return {
        success: true,
        result: result,
        suggestions: result.confidence < 0.6 ? this.generateSuggestions(result) : []
      };
    }
    
    return { 
      success: false, 
      error: 'Not recognized as flight query',
      messageType: this.identifyMessageType(cleaned)
    };
  }

  /**
   * Test the parser with various inputs
   * @returns {Object} Test results
   */
  runTests() {
    const testCases = [
      "Mumbai to Delhi tomorrow",
      "Flight from BOM to DEL on 25th December",
      "Need tickets from NYC to London on 2025-01-15",
      "Delhi to Mumbai for 2 passengers",
      "BLR → DEL next Monday",
      "Going Chennai to Kolkata 25 Dec",
      "Book flight Mumbai Singapore Jan 20th",
      "Round trip Delhi Bangkok January 15 return January 25",
      "Hi how are you?",
      "Book flight",
      "Mumbai Delhi",
      "Tomorrow flight",
      "2 passengers Mumbai to Delhi"
    ];

    console.log('🧪 ===== RUNNING PARSER TESTS =====');
    const results = {};
    
    testCases.forEach((testCase, index) => {
      console.log(`\n--- Test ${index + 1}: "${testCase}" ---`);
      const result = this.parseFlightQuery(testCase);
      results[`test_${index + 1}`] = {
        input: testCase,
        output: result,
        success: result.confidence > 0.5
      };
    });
    
    return results;
  }

  /**
   * Benchmark parser performance
   * @param {number} iterations - Number of iterations to run
   * @returns {Object} Benchmark results
   */
  benchmark(iterations = 1000) {
    console.log('⚡ ===== PARSER BENCHMARK =====');
    
    const testMessage = "Mumbai to Delhi tomorrow for 2 passengers";
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      this.parseFlightQuery(testMessage);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    const results = {
      iterations,
      totalTime,
      averageTime: avgTime,
      messagesPerSecond: Math.round(1000 / avgTime),
      performance: avgTime < 5 ? 'excellent' : avgTime < 20 ? 'good' : 'needs optimization'
    };
    
    console.log('📊 Benchmark results:', results);
    return results;
  }
}

// Export singleton instance
module.exports = new MessageParser();