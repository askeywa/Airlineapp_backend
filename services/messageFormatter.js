// Message Formatter Service - services/messageFormatter.js
// Handles formatting of flight results and responses for WhatsApp

class MessageFormatter {
  constructor() {
    this.emojis = {
      flight: '✈️',
      search: '🔍',
      price: '💰',
      time: '⏰',
      departure: '🛫',
      arrival: '🛬',
      duration: '⏱️',
      stops: '🔄',
      passengers: '👥',
      calendar: '📅',
      location: '📍',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
      phone: '📞',
      arrow: '➡️',
      star: '⭐',
      fire: '🔥',
      sparkles: '✨'
    };

    this.airlines = {
      'AA': 'American Airlines',
      'DL': 'Delta Air Lines', 
      'UA': 'United Airlines',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'KL': 'KLM',
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'SG': 'SpiceJet',
      'AI': 'Air India',
      '6E': 'IndiGo',
      'UK': 'Vistara',
      'G8': 'Go Air',
      'I5': 'AirAsia India',
      'SJ': 'SpiceJet'
    };
  }

  /**
   * Format flight search results for WhatsApp
   * @param {Array} flights - Array of flight objects
   * @param {Object} searchParams - Search parameters used
   * @returns {string} Formatted message
   */
  formatFlightResults(flights, searchParams) {
    if (!flights || flights.length === 0) {
      return this.formatNoFlightsMessage(searchParams);
    }

    const maxFlights = Math.min(5, flights.length);
    const selectedFlights = flights.slice(0, maxFlights);

    let message = this.formatSearchHeader(searchParams);
    message += '\n━━━━━━━━━━━━━━━━━━━━━━\n\n';

    selectedFlights.forEach((flight, index) => {
      message += this.formatSingleFlight(flight, index + 1);
      if (index < selectedFlights.length - 1) {
        message += '\n━━━━━━━━━━━━━━━━━━━━━━\n\n';
      }
    });

    message += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
    message += this.formatFooterMessage(searchParams);

    return message;
  }

  /**
   * Format search header with parameters
   * @param {Object} searchParams - Search parameters
   * @returns {string} Formatted header
   */
  formatSearchHeader(searchParams) {
    const { origin, destination, departureDate, returnDate, adults } = searchParams;
    
    let header = `${this.emojis.flight} *FLIGHT SEARCH RESULTS*\n\n`;
    header += `${this.emojis.location} Route: *${origin}* ${this.emojis.arrow} *${destination}*\n`;
    header += `${this.emojis.calendar} Departure: *${this.formatDateForDisplay(departureDate)}*\n`;
    
    if (returnDate) {
      header += `${this.emojis.calendar} Return: *${this.formatDateForDisplay(returnDate)}*\n`;
    }
    
    header += `${this.emojis.passengers} Passengers: *${adults}*`;
    
    return header;
  }

  /**
   * Format a single flight result
   * @param {Object} flight - Flight object
   * @param {number} index - Flight number in the list
   * @returns {string} Formatted flight details
   */
  formatSingleFlight(flight, index) {
    const price = flight.price?.total || 'N/A';
    const currency = flight.price?.currency || '';
    const airline = this.getAirlineName(flight.validatingAirlineCodes?.[0]);
    
    let flightMsg = `${this.emojis.star} *OPTION ${index}* - ${airline}\n`;
    
    // Price with highlighting for good deals
    const priceNum = parseFloat(price);
    const priceEmoji = priceNum < 10000 ? this.emojis.fire : this.emojis.price;
    flightMsg += `${priceEmoji} *${currency} ${this.formatPrice(price)}*\n`;
    
    // Flight route details
    const segments = flight.itineraries?.[0]?.segments || [];
    if (segments.length > 0) {
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      
      // Duration
      const duration = flight.itineraries?.[0]?.duration;
      if (duration) {
        flightMsg += `${this.emojis.duration} Duration: *${this.formatDuration(duration)}*\n`;
      }
      
      // Departure
      if (firstSegment.departure) {
        const depTime = this.formatTime(firstSegment.departure.at);
        const depDate = this.formatDateShort(firstSegment.departure.at);
        flightMsg += `${this.emojis.departure} Depart: *${firstSegment.departure.iataCode}* at *${depTime}* (${depDate})\n`;
      }
      
      // Arrival
      if (lastSegment.arrival) {
        const arrTime = this.formatTime(lastSegment.arrival.at);
        const arrDate = this.formatDateShort(lastSegment.arrival.at);
        flightMsg += `${this.emojis.arrival} Arrive: *${lastSegment.arrival.iataCode}* at *${arrTime}* (${arrDate})\n`;
      }
      
      // Stops information
      const stops = segments.length - 1;
      if (stops > 0) {
        flightMsg += `${this.emojis.stops} Stops: *${stops}*`;
        if (stops === 1) {
          const stopAirport = segments[0].arrival?.iataCode;
          if (stopAirport) {
            flightMsg += ` (via ${stopAirport})`;
          }
        }
        flightMsg += '\n';
      } else {
        flightMsg += `${this.emojis.success} *Direct Flight*\n`;
      }
    }
    
    // Flight numbers
    if (segments.length > 0) {
      const flightNumbers = segments.map(seg => 
        `${seg.carrierCode}${seg.number}`
      ).join(', ');
      flightMsg += `${this.emojis.info} Flight: *${flightNumbers}*`;
    }
    
    return flightMsg;
  }

  /**
   * Format no flights found message
   * @param {Object} searchParams - Search parameters
   * @returns {string} No flights message
   */
  formatNoFlightsMessage(searchParams) {
    let message = `${this.emojis.search} *FLIGHT SEARCH RESULTS*\n\n`;
    message += `${this.emojis.warning} No flights found for your search:\n\n`;
    message += `${this.emojis.location} Route: ${searchParams.origin} ${this.emojis.arrow} ${searchParams.destination}\n`;
    message += `${this.emojis.calendar} Date: ${this.formatDateForDisplay(searchParams.departureDate)}\n`;
    message += `${this.emojis.passengers} Passengers: ${searchParams.adults}\n\n`;
    message += `${this.emojis.info} *Suggestions:*\n`;
    message += `• Try different dates\n`;
    message += `• Check nearby airports\n`;
    message += `• Consider flexible travel dates\n\n`;
    message += `${this.emojis.phone} Need help? Reply with "help" or call us directly.`;
    
    return message;
  }

  /**
   * Format footer message with booking instructions
   * @param {Object} searchParams - Search parameters
   * @returns {string} Footer message
   */
  formatFooterMessage(searchParams) {
    let footer = `${this.emojis.phone} *TO BOOK:*\n`;
    footer += `Reply with option number (1-5) or call us\n\n`;
    footer += `${this.emojis.info} *Need different dates?*\n`;
    footer += `Send: "${searchParams.origin} to ${searchParams.destination} on [NEW DATE]"\n\n`;
    footer += `${this.emojis.sparkles} Prices shown are indicative. Final price may vary.`;
    
    return footer;
  }

  /**
   * Format welcome/help message
   * @param {string} userName - User's name
   * @returns {string} Welcome message
   */
  formatWelcomeMessage(userName = 'there') {
    let message = `${this.emojis.flight} *Welcome to Flight Booking!*\n\n`;
    message += `Hello ${userName}! ${this.emojis.sparkles}\n\n`;
    message += `${this.emojis.info} *How to search for flights:*\n\n`;
    message += `*Format:* FROM to DESTINATION on DATE\n\n`;
    message += `${this.emojis.star} *Examples:*\n`;
    message += `• Mumbai to Delhi tomorrow\n`;
    message += `• NYC to London on 25th Dec\n`;
    message += `• BOM to DXB on 2025-01-15 for 2\n\n`;
    message += `${this.emojis.info} *Supported formats:*\n`;
    message += `• City names or airport codes\n`;
    message += `• Dates: tomorrow, 15th Jan, 2025-01-15\n`;
    message += `• Passenger count: "for 3 passengers"\n\n`;
    message += `${this.emojis.phone} Ready to help you find the best flights!`;
    
    return message;
  }

  /**
   * Format error message
   * @param {string} errorType - Type of error
   * @param {string} details - Error details
   * @returns {string} Formatted error message
   */
  formatErrorMessage(errorType, details = '') {
    let message = `${this.emojis.error} *Something went wrong*\n\n`;
    
    switch (errorType) {
      case 'parsing':
        message += `${this.emojis.warning} I couldn't understand your flight search.\n\n`;
        message += `${this.emojis.info} *Please try this format:*\n`;
        message += `FROM to DESTINATION on DATE\n\n`;
        message += `${this.emojis.star} *Example:*\n`;
        message += `"Mumbai to Delhi tomorrow for 2"\n`;
        break;
        
      case 'api':
        message += `${this.emojis.warning} Flight search service is temporarily unavailable.\n\n`;
        message += `${this.emojis.info} Please try again in a few minutes.\n`;
        break;
        
      case 'network':
        message += `${this.emojis.warning} Connection issue occurred.\n\n`;
        message += `${this.emojis.info} Please check your connection and try again.\n`;
        break;
        
      default:
        message += `${this.emojis.warning} An unexpected error occurred.\n\n`;
        message += `${this.emojis.phone} Please try again or contact support.\n`;
    }
    
    if (details) {
      message += `\n${this.emojis.info} *Details:* ${details}`;
    }
    
    return message;
  }

  /**
   * Format parsing suggestions when query is incomplete
   * @param {Object} searchParams - Partial search parameters
   * @returns {string} Suggestion message
   */
  formatParsingSuggestions(searchParams) {
    let message = `${this.emojis.search} *Almost there!*\n\n`;
    
    const missing = [];
    if (!searchParams.origin) missing.push('departure city');
    if (!searchParams.destination) missing.push('destination city');
    if (!searchParams.departureDate) missing.push('travel date');
    
    if (missing.length > 0) {
      message += `${this.emojis.warning} Missing: *${missing.join(', ')}*\n\n`;
    }
    
    message += `${this.emojis.info} *Complete format:*\n`;
    message += `FROM to DESTINATION on DATE\n\n`;
    message += `${this.emojis.star} *Example:*\n`;
    message += `"${searchParams.origin || 'Mumbai'} to ${searchParams.destination || 'Delhi'} on ${searchParams.departureDate || 'tomorrow'}"`;
    
    return message;
  }

  /**
   * Format booking confirmation request
   * @param {Object} flight - Selected flight
   * @param {number} optionNumber - Flight option number
   * @returns {string} Booking confirmation message
   */
  formatBookingConfirmation(flight, optionNumber) {
    const price = flight.price?.total || 'N/A';
    const currency = flight.price?.currency || '';
    const airline = this.getAirlineName(flight.validatingAirlineCodes?.[0]);
    
    let message = `${this.emojis.success} *BOOKING CONFIRMATION*\n\n`;
    message += `You selected: *Option ${optionNumber}*\n\n`;
    message += `${this.emojis.flight} Airline: *${airline}*\n`;
    message += `${this.emojis.price} Price: *${currency} ${this.formatPrice(price)}*\n\n`;
    
    const segments = flight.itineraries?.[0]?.segments || [];
    if (segments.length > 0) {
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      
      message += `${this.emojis.departure} Departure: *${firstSegment.departure?.iataCode}* at *${this.formatTime(firstSegment.departure?.at)}*\n`;
      message += `${this.emojis.arrival} Arrival: *${lastSegment.arrival?.iataCode}* at *${this.formatTime(lastSegment.arrival?.at)}*\n\n`;
    }
    
    message += `${this.emojis.phone} *To proceed with booking:*\n`;
    message += `Please call our booking team or visit our website.\n\n`;
    message += `${this.emojis.info} This selection is held for 15 minutes.`;
    
    return message;
  }

  /**
   * Format typing/processing message
   * @param {string} action - Action being performed
   * @returns {string} Processing message
   */
  formatProcessingMessage(action = 'searching') {
    const messages = {
      searching: `${this.emojis.search} Searching for flights... Please wait.`,
      booking: `${this.emojis.flight} Processing your booking request...`,
      loading: `${this.emojis.time} Loading flight details...`
    };
    
    return messages[action] || messages.searching;
  }

  // Helper Methods

  /**
   * Get airline name from code
   * @param {string} code - Airline IATA code
   * @returns {string} Airline name
   */
  getAirlineName(code) {
    return this.airlines[code] || code || 'Unknown Airline';
  }

  /**
   * Format price with thousands separator
   * @param {string|number} price - Price to format
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    if (!price || price === 'N/A') return 'N/A';
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    
    return numPrice.toLocaleString('en-IN');
  }

  /**
   * Format duration from ISO 8601 format
   * @param {string} duration - Duration in ISO format
   * @returns {string} Formatted duration
   */
  formatDuration(duration) {
    if (!duration) return 'N/A';
    
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (!match) return duration;
      
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      }
      
      return duration;
    } catch (error) {
      return duration;
    }
  }

  /**
   * Format time from ISO string
   * @param {string} isoString - ISO date string
   * @returns {string} Formatted time
   */
  formatTime(isoString) {
    if (!isoString) return 'N/A';
    
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Format date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format date (short version)
   * @param {string} isoString - ISO date string
   * @returns {string} Short formatted date
   */
  formatDateShort(isoString) {
    if (!isoString) return 'N/A';
    
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Truncate message to WhatsApp limits
   * @param {string} message - Message to truncate
   * @param {number} maxLength - Maximum length (default 4000)
   * @returns {string} Truncated message
   */
  truncateMessage(message, maxLength = 4000) {
    if (!message || message.length <= maxLength) {
      return message;
    }
    
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Clean message for WhatsApp (remove unsupported characters)
   * @param {string} message - Message to clean
   * @returns {string} Cleaned message
   */
  cleanForWhatsApp(message) {
    if (!message) return '';
    
    return message
      .replace(/[^\u0000-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2400-\u243F\u2440-\u245F\u2460-\u24FF\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF]/g, '')
      .trim();
  }
}

module.exports = new MessageFormatter();