// Fixed WhatsApp Controller - controllers/whatsappController.js
const whatsappService = require('../services/whatsappService');
const amadeusService = require('../services/amadeusService');

class WhatsAppController {
  
  // Handle incoming WhatsApp messages - MAIN METHOD
  async handleIncomingMessage(req, res) {
    try {
      console.log('🎯 ===== PROCESSING INCOMING MESSAGE =====');
      console.log('🌐 Webhook URL: https://honeynwild.com/Airlineapp/webhook');
      const body = req.body;
      console.log('🎯 Raw body received:', JSON.stringify(body, null, 2));
      
      // Immediately respond to WhatsApp to prevent timeouts
      if (res && !res.headersSent) {
        res.status(200).send('OK');
        console.log('✅ Quick response sent to Meta');
      }
      
      // Check if the request contains entry data
      if (!body.entry || !Array.isArray(body.entry) || body.entry.length === 0) {
        console.log('⚠️ No entry data found in request');
        return;
      }

      // Process each entry
      for (const entry of body.entry) {
        console.log('🔍 Processing entry:', entry.id);
        
        if (!entry.changes || !Array.isArray(entry.changes)) {
          console.log('⚠️ No changes found in entry');
          continue;
        }

        // Process each change
        for (const change of entry.changes) {
          console.log('🔄 Processing change:', { field: change.field, hasValue: !!change.value });
          
          // Only process messages (not status updates)
          if (change.field !== 'messages') {
            console.log('⏭ Skipping non-message change:', change.field);
            continue;
          }

          if (!change.value) {
            console.log('⚠️ No value found in change');
            continue;
          }

          const changeValue = change.value;
          console.log('📨 Change value structure:', {
            hasMessages: !!changeValue.messages,
            hasMetadata: !!changeValue.metadata,
            hasContacts: !!changeValue.contacts,
            messageCount: changeValue.messages ? changeValue.messages.length : 0
          });

          // Check if there are messages to process
          if (!changeValue.messages || !Array.isArray(changeValue.messages) || changeValue.messages.length === 0) {
            console.log('⚠️ No messages found in change value');
            continue;
          }

          // Get phone number ID from metadata
          const phoneNumberId = changeValue.metadata?.phone_number_id;
          console.log('📱 Phone number ID from metadata:', phoneNumberId);

          // Process each message
          for (const message of changeValue.messages) {
            console.log('💬 Processing individual message:', {
              id: message.id,
              from: message.from,
              type: message.type,
              timestamp: message.timestamp,
              hasText: !!message.text
            });
            
            // Process message asynchronously to avoid blocking
            WhatsAppController.processMessage(message, phoneNumberId, changeValue)
              .catch(error => {
                console.error('❌ Error in async message processing:', error.message);
              });
          }
        }
      }

      console.log('✅ Finished processing all entries');
      return;
      
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
      console.error('Error stack:', error.stack);
      
      // Ensure we still send OK response if not already sent
      if (res && !res.headersSent) {
        res.status(200).send('OK');
      }
      return;
    }
  }

  // Add handleWebhook method for backward compatibility
  async handleWebhook(webhookData) {
    console.log('🔄 handleWebhook called - redirecting to handleIncomingMessage');
    
    // Create mock req/res objects
    const mockReq = {
      body: webhookData,
      headers: {},
      get: () => null
    };
    
    const mockRes = {
      status: () => mockRes,
      send: () => mockRes,
      json: () => mockRes,
      headersSent: false
    };
    
    return await this.handleIncomingMessage(mockReq, mockRes);
  }

  // Process individual message
  static async processMessage(message, phoneNumberId, changeValue) {
    try {
      console.log('🔄 ===== PROCESSING INDIVIDUAL MESSAGE =====');
      
      const userPhone = message.from;
      const messageId = message.id;
      const messageType = message.type;
      const timestamp = message.timestamp;
      
      console.log('🔍 Message details:', {
        from: userPhone,
        id: messageId,
        type: messageType,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
      });

      // Handle different message types
      let messageText = '';
      
      if (messageType === 'text' && message.text && message.text.body) {
        messageText = message.text.body.toLowerCase().trim();
        console.log('🔍 Text message content:', messageText);
      } else if (messageType === 'interactive') {
        // Handle interactive messages (buttons, lists) in v23
        if (message.interactive?.type === 'button_reply') {
          messageText = message.interactive.button_reply.title?.toLowerCase().trim() || '';
          console.log('🔘 Button reply:', messageText);
        } else if (message.interactive?.type === 'list_reply') {
          messageText = message.interactive.list_reply.title?.toLowerCase().trim() || '';
          console.log('📋 List reply:', messageText);
        } else {
          console.log('⚠️ Unknown interactive message type');
          await whatsappService.sendTextMessage(
            userPhone, 
            "I received your interactive message but couldn't process it. Please send a text message about flight search!"
          );
          return;
        }
      } else {
        console.log('⚠️ Non-text message or no text body found, type:', messageType);
        // Handle other message types with immediate response
        let responseMessage = "🤖 Hello! I'm your flight booking assistant.\n\n";
        
        if (messageType === 'image') {
          responseMessage += "📷 I see you sent an image! For flight searches, please send me text with your travel details.";
        } else if (messageType === 'audio') {
          responseMessage += "🎵 I received your audio message! For flight searches, please send me text with your travel details.";
        } else if (messageType === 'video') {
          responseMessage += "🎥 I see your video! For flight searches, please send me text with your travel details.";
        } else if (messageType === 'document') {
          responseMessage += "📄 I received your document! For flight searches, please send me text with your travel details.";
        } else if (messageType === 'location') {
          responseMessage += "📍 Thanks for sharing your location! For flight searches, please send me text with your departure and destination cities.";
        } else if (messageType === 'contacts') {
          responseMessage += "👤 I received contact information! For flight searches, please send me text with your travel details.";
        } else {
          responseMessage += "I can help you search for flights! Please send a text message with your travel requirements.";
        }
        
        responseMessage += "\n\n💡 Example: 'Search flights from NYC to LAX on 2024-12-25'";
        
        await whatsappService.sendTextMessage(userPhone, responseMessage);
        return;
      }

      // Get contact information if available
      const contacts = changeValue.contacts || [];
      const contact = contacts.find(c => c.wa_id === userPhone);
      const userName = contact?.profile?.name || 'User';
      
      console.log('👤 Contact info:', { userName, contactFound: !!contact });
      console.log(`📱 Received message from ${userName} (${userPhone}): "${messageText}"`);

      // Send typing indicator to show we're processing
      try {
        await whatsappService.sendTypingIndicator(userPhone);
        console.log('⌨️ Typing indicator sent');
      } catch (error) {
        console.error('⚠️ Failed to send typing indicator:', error.message);
      }

      // Mark message as read (v23 feature)
      try {
        await whatsappService.markMessageAsRead(messageId);
        console.log('📖 Message marked as read');
      } catch (error) {
        console.error('⚠️ Failed to mark message as read:', error.message);
      }

      // Add a small delay to make it feel more natural
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if message contains flight search keywords or is a help request
      if (messageText.includes('help') || messageText.includes('menu') || messageText.includes('start') || messageText.includes('hi') || messageText.includes('hello')) {
        console.log('❓ Help/greeting request detected');
        await WhatsAppController.sendHelpMessage(userPhone, userName);
      } else if (WhatsAppController.isFlightQuery(messageText)) {
        console.log('✈️ Detected flight query, processing...');
        await WhatsAppController.handleFlightSearch(messageText, userPhone, userName);
      } else {
        console.log('❓ No flight keywords detected, sending help message');
        await WhatsAppController.sendHelpMessage(userPhone, userName);
      }

      console.log('✅ Message processing completed');

    } catch (error) {
      console.error('❌ Error processing individual message:', error);
      console.error('Error stack:', error.stack);
      
      // Send error message to user
      try {
        await whatsappService.sendTextMessage(
          message.from, 
          "Sorry, I encountered an error while processing your request. Please try again later. 😔"
        );
      } catch (sendError) {
        console.error('❌ Failed to send error message to user:', sendError);
      }
    }
  }

  // Check if message is a flight search query
  static isFlightQuery(message) {
    const flightKeywords = [
      'flight', 'flights', 'book', 'search', 'travel', 'ticket', 'tickets',
      'fly', 'airline', 'trip', 'journey', 'departure', 'arrival', 'plane',
      'from', 'to', 'airport', 'boeing', 'airbus', 'vacation', 'holiday'
    ];
    
    const hasKeyword = flightKeywords.some(keyword => message.includes(keyword));
    console.log('🔍 Flight keyword check:', { 
      hasKeyword, 
      keywords: flightKeywords.filter(k => message.includes(k)),
      message: message.substring(0, 50)
    });
    
    return hasKeyword;
  }

  // Handle flight search requests
  static async handleFlightSearch(messageText, userPhone, userName = 'User') {
    try {
      console.log('🛫 ===== HANDLING FLIGHT SEARCH =====');
      
      // Parse the message to extract flight search parameters
      const searchParams = WhatsAppController.parseFlightQuery(messageText);
      console.log('🔍 Parsed search parameters:', searchParams);
      
      if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
        console.log('⚠️ Missing required search parameters, sending help');
        
        const helpText = `🛫 *Flight Search Help*

Hi ${userName}! I'd be happy to help you find flights.

Please provide your flight details in this format:
"Search flights from [ORIGIN] to [DESTINATION] on [DATE]"

*Examples:*
• "Search flights from NYC to LAX on 2024-12-25"
• "Flight from London to Paris on Dec 20"
• "Book ticket Mumbai to Delhi tomorrow"

*Popular city codes:*
NYC (New York), LAX (Los Angeles), LHR (London), 
CDG (Paris), BOM (Mumbai), DEL (Delhi), DXB (Dubai)

Just type your search and I'll find the best options! ✈️`;

        await whatsappService.sendTextMessage(userPhone, helpText);
        return;
      }

      // Send searching message
      await whatsappService.sendTextMessage(
        userPhone, 
        `🔍 Searching flights from ${searchParams.origin} to ${searchParams.destination} on ${searchParams.departureDate}...

Please wait while I find the best options for you! ⏳`
      );

      // Search for flights using Amadeus API
      console.log('🔍 Calling Amadeus API with params:', searchParams);
      const flights = await amadeusService.searchFlights(searchParams);
      console.log('📊 Amadeus API response:', { flightCount: flights ? flights.length : 0 });
      
      if (!flights || flights.length === 0) {
        console.log('❌ No flights found');
        await whatsappService.sendTextMessage(
          userPhone, 
          `❌ No flights found for your search criteria:
          
🛫 Route: ${searchParams.origin} → ${searchParams.destination}
📅 Date: ${searchParams.departureDate}

Please try:
• Different dates
• Alternative nearby airports  
• Check spelling of city names

Would you like to try another search? ✈️

Type "help" for examples and popular routes.`
        );
        return;
      }

      // Send top 5 flight results
      const topFlights = flights.slice(0, 5);
      await WhatsAppController.sendFlightResults(userPhone, topFlights, searchParams);

    } catch (error) {
      console.error('❌ Flight search error:', error);
      await whatsappService.sendTextMessage(
        userPhone, 
        "Sorry, I couldn't search for flights right now. Please try again in a few minutes. 🔄"
      );
    }
  }

  // Parse flight query from natural language
  static parseFlightQuery(message) {
    const searchParams = {
      origin: null,
      destination: null,
      departureDate: null,
      adults: 1
    };

    console.log('🔍 Parsing message:', message);

    // Enhanced parsing logic
    const fromMatch = message.match(/from\s+([a-zA-Z]{3,}(?:\s+[a-zA-Z]+)*)/i);
    const toMatch = message.match(/to\s+([a-zA-Z]{3,}(?:\s+[a-zA-Z]+)*)/i);
    const dateMatch = message.match(/on\s+([0-9-]{8,}|tomorrow|today|next\s+\w+)/i);

    if (fromMatch) {
      let origin = fromMatch[1].trim();
      // Convert common city names to airport codes
      origin = WhatsAppController.convertCityToCode(origin);
      searchParams.origin = origin.toUpperCase();
    }
    
    if (toMatch) {
      let destination = toMatch[1].trim();
      // Convert common city names to airport codes  
      destination = WhatsAppController.convertCityToCode(destination);
      searchParams.destination = destination.toUpperCase();
    }
    
    if (dateMatch) {
      const dateStr = dateMatch[1].toLowerCase();
      if (dateStr === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        searchParams.departureDate = tomorrow.toISOString().split('T')[0];
      } else if (dateStr === 'today') {
        searchParams.departureDate = new Date().toISOString().split('T')[0];
      } else if (dateStr.startsWith('next')) {
        // Handle "next week", "next month", etc.
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        searchParams.departureDate = nextWeek.toISOString().split('T')[0];
      } else {
        searchParams.departureDate = dateStr;
      }
    }

    console.log('🔍 Parsed parameters:', searchParams);
    return searchParams;
  }

  // Convert city names to airport codes
  static convertCityToCode(cityName) {
    const cityToCode = {
      'new york': 'NYC',
      'nyc': 'NYC', 
      'los angeles': 'LAX',
      'la': 'LAX',
      'london': 'LHR',
      'paris': 'CDG',
      'mumbai': 'BOM',
      'delhi': 'DEL',
      'dubai': 'DXB',
      'singapore': 'SIN',
      'bangkok': 'BKK',
      'tokyo': 'NRT',
      'sydney': 'SYD',
      'melbourne': 'MEL',
      'toronto': 'YYZ',
      'vancouver': 'YVR'
    };

    const normalized = cityName.toLowerCase().trim();
    return cityToCode[normalized] || cityName;
  }

  // Send flight search results to user  
  static async sendFlightResults(userPhone, flights, searchParams) {
    try {
      let resultMessage = `✈️ *Flight Search Results*\n\n`;
      resultMessage += `📍 ${searchParams.origin} ✈️ ${searchParams.destination}\n`;
      resultMessage += `📅 ${searchParams.departureDate}\n\n`;

      flights.forEach((flight, index) => {
        const price = flight.price?.total || 'N/A';
        const currency = flight.price?.currency || '';
        const duration = flight.itineraries?.[0]?.duration || 'N/A';
        const airline = flight.validatingAirlineCodes?.[0] || 'N/A';
        
        resultMessage += `*${index + 1}. Flight Option*\n`;
        resultMessage += `💰 Price: ${price} ${currency}\n`;
        resultMessage += `⏱️ Duration: ${duration}\n`;  
        resultMessage += `🏢 Airline: ${airline}\n`;
        resultMessage += `────────────────\n\n`;
      });

      resultMessage += `📞 To book any of these flights, please call us or reply with the flight number.\n\n`;
      resultMessage += `💡 Need different dates or destinations? Just send another search!`;

      await whatsappService.sendTextMessage(userPhone, resultMessage);
      
    } catch (error) {
      console.error('❌ Error sending flight results:', error);
      throw error;
    }
  }

  // Send help message for unrecognized queries
  static async sendHelpMessage(userPhone, userName = 'User') {
    const helpMessage = `👋 *Welcome ${userName}!*

I'm your Airline Booking Assistant! ✈️

*How to search for flights:*
"Search flights from [ORIGIN] to [DESTINATION] on [DATE]"

*Examples:*
• "Flight from NYC to LAX on 2024-12-25"
• "Search Mumbai to Delhi tomorrow"  
• "Book ticket London to Paris on Dec 20"

*Popular destinations:*
🇺🇸 NYC, LAX, MIA, CHI
🇬🇧 LHR (London), MAN (Manchester)
🇫🇷 CDG (Paris), NCE (Nice)
🇮🇳 BOM (Mumbai), DEL (Delhi), BLR (Bangalore)
🇦🇪 DXB (Dubai), AUH (Abu Dhabi)

Just type your flight search and I'll find the best options for you! ✈️

*Need help?* Type "help" anytime!`;

    await whatsappService.sendTextMessage(userPhone, helpMessage);
  }
}

module.exports = WhatsAppController;