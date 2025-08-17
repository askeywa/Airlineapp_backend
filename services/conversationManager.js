// Conversation Manager - services/conversationManager.js
// Manages conversation flow and user context

class ConversationManager {
  constructor() {
    // Store user conversations in memory (in production, use Redis/Database)
    this.conversations = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Conversation states
    this.states = {
      INITIAL: 'initial',
      SEARCHING: 'searching',
      RESULTS_SHOWN: 'results_shown',
      FLIGHT_SELECTED: 'flight_selected',
      BOOKING: 'booking',
      HELP: 'help',
      ERROR: 'error'
    };
    
    // Intent patterns for understanding user messages
    this.intents = {
      FLIGHT_SEARCH: {
        patterns: [
          /flight.*from.*to/i,
          /book.*flight/i,
          /search.*flight/i,
          /travel.*from.*to/i,
          /need.*ticket/i,
          /\w+\s+to\s+\w+\s+on/i
        ],
        confidence: 0.8
      },
      SELECT_FLIGHT: {
        patterns: [
          /option\s*(\d+)/i,
          /select\s*(\d+)/i,
          /book\s*(\d+)/i,
          /choose\s*(\d+)/i,
          /^(\d+)$/
        ],
        confidence: 0.9
      },
      HELP: {
        patterns: [
          /help/i,
          /how.*work/i,
          /what.*do/i,
          /instructions/i,
          /guide/i
        ],
        confidence: 0.7
      },
      MODIFY_SEARCH: {
        patterns: [
          /different.*date/i,
          /change.*date/i,
          /other.*option/i,
          /modify.*search/i,
          /new.*search/i
        ],
        confidence: 0.7
      },
      CANCEL: {
        patterns: [
          /cancel/i,
          /stop/i,
          /quit/i,
          /exit/i,
          /no.*thanks/i
        ],
        confidence: 0.8
      }
    };
    
    // Quick responses for common queries
    this.quickResponses = {
      greeting: [
        "Hello! I'm here to help you find flights. ✈️",
        "Hi there! Ready to search for flights? 🛫",
        "Welcome! Let me help you book your next flight! 🌟"
      ],
      goodbye: [
        "Thank you for using our service! Have a great day! 👋",
        "Goodbye! Feel free to search for flights anytime! ✈️",
        "Thanks for choosing us! Safe travels! 🛫"
      ]
    };
  }

  /**
   * Process incoming message and manage conversation flow
   * @param {string} userPhone - User's phone number
   * @param {string} message - User's message
   * @param {Object} context - Additional context (contact info, etc.)
   * @returns {Object} Response with action and data
   */
  async processMessage(userPhone, message, context = {}) {
    try {
      console.log(`💬 Processing message from ${userPhone}: "${message}"`);
      
      // Get or create user session
      const session = this.getOrCreateSession(userPhone, context);
      
      // Clean and analyze the message
      const cleanMessage = message.toLowerCase().trim();
      const intent = this.detectIntent(cleanMessage, session);
      
      console.log(`🧠 Detected intent: ${intent.type} (confidence: ${intent.confidence})`);
      
      // Update session with latest activity
      session.lastMessage = message;
      session.lastActivity = Date.now();
      session.messageCount += 1;
      
      // Route to appropriate handler based on intent
      let response;
      
      switch (intent.type) {
        case 'FLIGHT_SEARCH':
          response = await this.handleFlightSearch(session, message, intent);
          break;
          
        case 'SELECT_FLIGHT':
          response = await this.handleFlightSelection(session, message, intent);
          break;
          
        case 'HELP':
          response = this.handleHelp(session);
          break;
          
        case 'MODIFY_SEARCH':
          response = await this.handleModifySearch(session, message);
          break;
          
        case 'CANCEL':
          response = this.handleCancel(session);
          break;
          
        case 'GREETING':
          response = this.handleGreeting(session);
          break;
          
        case 'GOODBYE':
          response = this.handleGoodbye(session);
          break;
          
        default:
          response = await this.handleUnknown(session, message);
      }
      
      // Update session state
      if (response.newState) {
        session.state = response.newState;
        session.stateHistory.push({
          state: response.newState,
          timestamp: Date.now(),
          trigger: intent.type
        });
      }
      
      // Store any search results or selected flights
      if (response.searchResults) {
        session.lastSearchResults = response.searchResults;
      }
      
      if (response.selectedFlight) {
        session.selectedFlight = response.selectedFlight;
      }
      
      console.log(`📤 Response type: ${response.type}, state: ${session.state}`);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      return {
        type: 'error',
        message: 'Sorry, I encountered an error. Please try again.',
        newState: this.states.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Get or create user session
   * @param {string} userPhone - User's phone number
   * @param {Object} context - Additional context
   * @returns {Object} User session
   */
  getOrCreateSession(userPhone, context) {
    let session = this.conversations.get(userPhone);
    
    if (!session || this.isSessionExpired(session)) {
      session = {
        userPhone,
        userName: context.userName || 'User',
        state: this.states.INITIAL,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0,
        lastMessage: '',
        lastSearchParams: null,
        lastSearchResults: null,
        selectedFlight: null,
        stateHistory: [],
        preferences: {
          language: 'en',
          currency: 'INR',
          timezone: 'Asia/Kolkata'
        }
      };
      
      console.log(`👤 Created new session for ${userPhone}`);
    } else {
      console.log(`👤 Retrieved existing session for ${userPhone} (state: ${session.state})`);
    }
    
    this.conversations.set(userPhone, session);
    return session;
  }

  /**
   * Check if session is expired
   * @param {Object} session - User session
   * @returns {boolean} True if expired
   */
  isSessionExpired(session) {
    return (Date.now() - session.lastActivity) > this.sessionTimeout;
  }

  /**
   * Detect user intent from message
   * @param {string} message - User message
   * @param {Object} session - User session
   * @returns {Object} Detected intent with confidence
   */
  detectIntent(message, session) {
    let bestMatch = { type: 'UNKNOWN', confidence: 0, data: null };
    
    // Check greeting patterns
    if (/^(hi|hello|hey|good\s+(morning|afternoon|evening))/i.test(message)) {
      return { type: 'GREETING', confidence: 0.9, data: null };
    }
    
    // Check goodbye patterns
    if (/^(bye|goodbye|thanks|thank\s+you)/i.test(message) && session.state !== this.states.INITIAL) {
      return { type: 'GOODBYE', confidence: 0.8, data: null };
    }
    
    // Check each intent pattern
    for (const [intentType, intentConfig] of Object.entries(this.intents)) {
      for (const pattern of intentConfig.patterns) {
        const match = message.match(pattern);
        if (match && intentConfig.confidence > bestMatch.confidence) {
          bestMatch = {
            type: intentType,
            confidence: intentConfig.confidence,
            data: match
          };
        }
      }
    }
    
    // Context-aware adjustments
    if (session.state === this.states.RESULTS_SHOWN) {
      // If user sends a number while results are shown, likely selecting a flight
      const numberMatch = message.match(/^(\d+)$/);
      if (numberMatch) {
        bestMatch = {
          type: 'SELECT_FLIGHT',
          confidence: 0.95,
          data: numberMatch
        };
      }
    }
    
    return bestMatch;
  }

  /**
   * Handle flight search intent
   * @param {Object} session - User session
   * @param {string} message - User message
   * @param {Object} intent - Detected intent
   * @returns {Object} Response object
   */
  async handleFlightSearch(session, message, intent) {
    try {
      // Import services here to avoid circular dependencies
      const messageParser = require('./messageParser');
      const flightService = require('./flightService');
      const messageFormatter = require('./messageFormatter');
      
      console.log('🔍 Handling flight search request');
      
      // Parse the flight query
      const searchParams = messageParser.parseFlightQuery(message);
      
      if (searchParams.confidence < 0.5) {
        return {
          type: 'parsing_help',
          message: messageFormatter.formatParsingSuggestions(searchParams),
          newState: this.states.HELP
        };
      }
      
      // Store search parameters in session
      session.lastSearchParams = searchParams;
      
      // Perform flight search
      const searchResult = await flightService.searchFlights(searchParams);
      
      if (!searchResult.success) {
        return {
          type: 'search_error',
          message: messageFormatter.formatErrorMessage('api', searchResult.message),
          newState: this.states.ERROR
        };
      }
      
      // Format and return results
      const formattedResults = messageFormatter.formatFlightResults(
        searchResult.flights, 
        searchParams
      );
      
      return {
        type: 'flight_results',
        message: formattedResults,
        searchResults: searchResult.flights,
        searchParams: searchParams,
        newState: this.states.RESULTS_SHOWN
      };
      
    } catch (error) {
      console.error('❌ Error in flight search:', error);
      
      const messageFormatter = require('./messageFormatter');
      return {
        type: 'search_error',
        message: messageFormatter.formatErrorMessage('api', 'Flight search failed'),
        newState: this.states.ERROR
      };
    }
  }

  /**
   * Handle flight selection
   * @param {Object} session - User session
   * @param {string} message - User message
   * @param {Object} intent - Detected intent
   * @returns {Object} Response object
   */
  async handleFlightSelection(session, message, intent) {
    try {
      const messageFormatter = require('./messageFormatter');
      
      if (!session.lastSearchResults || session.lastSearchResults.length === 0) {
        return {
          type: 'selection_error',
          message: 'No flights available to select. Please search for flights first.',
          newState: this.states.INITIAL
        };
      }
      
      // Extract option number
      const optionMatch = intent.data;
      const optionNumber = parseInt(optionMatch[1]);
      
      if (isNaN(optionNumber) || optionNumber < 1 || optionNumber > session.lastSearchResults.length) {
        return {
          type: 'invalid_selection',
          message: `Please select a valid option (1-${session.lastSearchResults.length})`,
          newState: session.state // Keep current state
        };
      }
      
      // Get selected flight
      const selectedFlight = session.lastSearchResults[optionNumber - 1];
      
      // Format booking confirmation
      const confirmationMessage = messageFormatter.formatBookingConfirmation(
        selectedFlight, 
        optionNumber
      );
      
      return {
        type: 'flight_selected',
        message: confirmationMessage,
        selectedFlight: selectedFlight,
        newState: this.states.FLIGHT_SELECTED
      };
      
    } catch (error) {
      console.error('❌ Error in flight selection:', error);
      
      return {
        type: 'selection_error',
        message: 'Error processing your selection. Please try again.',
        newState: this.states.ERROR
      };
    }
  }

  /**
   * Handle help request
   * @param {Object} session - User session
   * @returns {Object} Response object
   */
  handleHelp(session) {
    const messageFormatter = require('./messageFormatter');
    
    return {
      type: 'help',
      message: messageFormatter.formatWelcomeMessage(session.userName),
      newState: this.states.HELP
    };
  }

  /**
   * Handle search modification
   * @param {Object} session - User session
   * @param {string} message - User message
   * @returns {Object} Response object
   */
  async handleModifySearch(session, message) {
    // Reset session state and handle as new search
    session.state = this.states.INITIAL;
    session.lastSearchResults = null;
    session.selectedFlight = null;
    
    return await this.handleFlightSearch(session, message, { type: 'FLIGHT_SEARCH', confidence: 0.8 });
  }

  /**
   * Handle cancel request
   * @param {Object} session - User session
   * @returns {Object} Response object
   */
  handleCancel(session) {
    // Reset session
    session.state = this.states.INITIAL;
    session.lastSearchResults = null;
    session.selectedFlight = null;
    
    return {
      type: 'cancel',
      message: 'Search cancelled. How else can I help you with flight bookings?',
      newState: this.states.INITIAL
    };
  }

  /**
   * Handle greeting
   * @param {Object} session - User session
   * @returns {Object} Response object
   */
  handleGreeting(session) {
    const response = this.quickResponses.greeting[
      Math.floor(Math.random() * this.quickResponses.greeting.length)
    ];
    
    const messageFormatter = require('./messageFormatter');
    const welcomeMessage = messageFormatter.formatWelcomeMessage(session.userName);
    
    return {
      type: 'greeting',
      message: `${response}\n\n${welcomeMessage}`,
      newState: this.states.INITIAL
    };
  }

  /**
   * Handle goodbye
   * @param {Object} session - User session
   * @returns {Object} Response object
   */
  handleGoodbye(session) {
    const response = this.quickResponses.goodbye[
      Math.floor(Math.random() * this.quickResponses.goodbye.length)
    ];
    
    return {
      type: 'goodbye',
      message: response,
      newState: this.states.INITIAL
    };
  }

  /**
   * Handle unknown intent
   * @param {Object} session - User session
   * @param {string} message - User message
   * @returns {Object} Response object
   */
  async handleUnknown(session, message) {
    const messageParser = require('./messageParser');
    const messageFormatter = require('./messageFormatter');
    
    // Try to parse as flight query anyway
    const searchParams = messageParser.parseFlightQuery(message);
    
    if (searchParams.confidence > 0.3) {
      // Partially parsed, offer suggestions
      return {
        type: 'partial_understanding',
        message: messageFormatter.formatParsingSuggestions(searchParams),
        newState: this.states.HELP
      };
    }
    
    // Completely unknown
    const helpMessage = `I didn't understand that. ${messageFormatter.formatWelcomeMessage(session.userName)}`;
    
    return {
      type: 'unknown',
      message: helpMessage,
      newState: this.states.HELP
    };
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    const stats = {
      totalSessions: this.conversations.size,
      activeSessions: 0,
      stateDistribution: {},
      averageMessages: 0
    };
    
    let totalMessages = 0;
    
    for (const session of this.conversations.values()) {
      if (!this.isSessionExpired(session)) {
        stats.activeSessions++;
      }
      
      stats.stateDistribution[session.state] = 
        (stats.stateDistribution[session.state] || 0) + 1;
      
      totalMessages += session.messageCount;
    }
    
    stats.averageMessages = stats.totalSessions > 0 ? 
      Math.round(totalMessages / stats.totalSessions * 100) / 100 : 0;
    
    return stats;
  }

  /**
   * Clean expired sessions
   * @returns {number} Number of sessions cleaned
   */
  cleanExpiredSessions() {
    let cleaned = 0;
    
    for (const [userPhone, session] of this.conversations.entries()) {
      if (this.isSessionExpired(session)) {
        this.conversations.delete(userPhone);
        cleaned++;
      }
    }
    
    console.log(`🧹 Cleaned ${cleaned} expired sessions`);
    return cleaned;
  }

  /**
   * Get user session info
   * @param {string} userPhone - User's phone number
   * @returns {Object|null} Session info or null
   */
  getSessionInfo(userPhone) {
    const session = this.conversations.get(userPhone);
    
    if (!session) {
      return null;
    }
    
    return {
      userPhone: session.userPhone,
      userName: session.userName,
      state: session.state,
      messageCount: session.messageCount,
      createdAt: new Date(session.createdAt).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      isExpired: this.isSessionExpired(session),
      hasSearchResults: !!session.lastSearchResults,
      hasSelectedFlight: !!session.selectedFlight
    };
  }
}

module.exports = new ConversationManager();