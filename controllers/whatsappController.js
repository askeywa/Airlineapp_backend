// Fixed WhatsApp Controller - controllers/whatsappController.js
const whatsappService = require('../services/whatsappService');
const conversationManager = require('../services/conversationManager');
const messageFormatter = require('../services/messageFormatter');

class WhatsAppController {
  
  /**
   * Handle incoming WhatsApp messages - MAIN METHOD
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleIncomingMessage(req, res) {
    try {
      console.log('🎯 ===== PROCESSING INCOMING MESSAGE =====');
      console.log('🌐 Webhook URL: https://airlineapp-backend.onrender.com/webhook');
      
      const body = req.body;
      console.log('📨 Raw body received:', JSON.stringify(body, null, 2));
      
      // Immediately respond to WhatsApp to prevent timeouts
      if (res && !res.headersSent) {
        res.status(200).send('OK');
        console.log('✅ Quick response sent to Meta');
      }
      
      // Validate webhook data structure
      if (!body.entry || !Array.isArray(body.entry) || body.entry.length === 0) {
        console.log('⚠️ No valid entry data found in request');
        return;
      }

      // Process each entry from WhatsApp
      for (const entry of body.entry) {
        await this.processWebhookEntry(entry);
      }

      console.log('✅ Finished processing all webhook entries');
      
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
      console.error('Error stack:', error.stack);
      
      // Ensure response is sent if not already done
      if (res && !res.headersSent) {
        res.status(200).send('OK');
      }
    }
  }

  /**
   * Process individual webhook entry
   * @param {Object} entry - Webhook entry from WhatsApp
   */
  async processWebhookEntry(entry) {
    try {
      console.log('🔍 Processing entry:', entry.id);
      
      if (!entry.changes || !Array.isArray(entry.changes)) {
        console.log('⚠️ No changes found in entry');
        return;
      }

      for (const change of entry.changes) {
        await this.processWebhookChange(change);
      }
      
    } catch (error) {
      console.error('❌ Error processing webhook entry:', error);
    }
  }

  /**
   * Process individual webhook change
   * @param {Object} change - Webhook change from WhatsApp
   */
  async processWebhookChange(change) {
    try {
      console.log('🔄 Processing change:', { field: change.field, hasValue: !!change.value });
      
      // Only process message changes
      if (change.field !== 'messages') {
        console.log('⭐️ Skipping non-message change:', change.field);
        return;
      }

      if (!change.value) {
        console.log('⚠️ No value found in change');
        return;
      }

      const changeValue = change.value;
      const phoneNumberId = changeValue.metadata?.phone_number_id;
      
      console.log('📱 Phone number ID from metadata:', phoneNumberId);
      console.log('📊 Change value structure:', {
        hasMessages: !!changeValue.messages,
        hasMetadata: !!changeValue.metadata,
        hasContacts: !!changeValue.contacts,
        messageCount: changeValue.messages ? changeValue.messages.length : 0
      });

      // Process messages if they exist
      if (changeValue.messages && Array.isArray(changeValue.messages) && changeValue.messages.length > 0) {
        for (const message of changeValue.messages) {
          // Process each message asynchronously to avoid blocking
          this.processIndividualMessage(message, changeValue, phoneNumberId)
            .catch(error => {
              console.error('❌ Error in async message processing:', error);
            });
        }
      } else {
        console.log('⚠️ No messages found in change value');
      }
      
    } catch (error) {
      console.error('❌ Error processing webhook change:', error);
    }
  }

  /**
   * Process individual WhatsApp message
   * @param {Object} message - Message object from WhatsApp
   * @param {Object} changeValue - Change value containing contacts and metadata
   * @param {string} phoneNumberId - Phone number ID from metadata
   */
  async processIndividualMessage(message, changeValue, phoneNumberId) {
    try {
      console.log('💬 ===== PROCESSING INDIVIDUAL MESSAGE =====');
      
      const userPhone = message.from;
      const messageId = message.id;
      const messageType = message.type;
      const timestamp = message.timestamp;
      
      console.log('📋 Message details:', {
        from: userPhone,
        id: messageId,
        type: messageType,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
      });

      // Extract message content based on type
      let messageContent = '';
      if (messageType === 'text' && message.text && message.text.body) {
        messageContent = message.text.body.trim();
      } else if (messageType === 'interactive') {
        // Handle button responses or list selections
        messageContent = this.extractInteractiveContent(message);
      } else {
        console.log('⚠️ Unsupported message type, sending help');
        await this.sendUnsupportedTypeResponse(userPhone);
        return;
      }

      console.log('💬 Message content:', messageContent);

      // Get contact information
      const contact = this.extractContactInfo(changeValue.contacts, userPhone);
      const userName = contact?.profile?.name || 'User';
      
      console.log('👤 User info:', { userName, phone: userPhone });

      // Mark message as read
      this.markMessageAsRead(messageId).catch(error => {
        console.warn('⚠️ Failed to mark message as read:', error.message);
      });

      // Send typing indicator for better UX
      this.sendTypingIndicator(userPhone).catch(error => {
        console.warn('⚠️ Failed to send typing indicator:', error.message);
      });

      // Process message through conversation manager
      const context = {
        userName,
        messageId,
        messageType,
        timestamp
      };

      const response = await conversationManager.processMessage(userPhone, messageContent, context);
      
      // Send response based on conversation manager's decision
      await this.sendResponseToUser(userPhone, response);

      console.log('✅ Message processing completed successfully');
      
    } catch (error) {
      console.error('❌ Error processing individual message:', error);
      
      // Send error response to user
      try {
        const errorMessage = messageFormatter.formatErrorMessage('api', 'Sorry, I encountered an error processing your message. Please try again in a moment.');
        await whatsappService.sendTextMessage(message.from, errorMessage);
      } catch (sendError) {
        console.error('❌ Failed to send error response:', {
          originalError: error.message,
          sendError: sendError.message,
          userPhone: message.from
        });
        
        // Last resort - try a simple text message
        try {
          await whatsappService.sendTextMessage(message.from, 'Sorry, I am experiencing technical difficulties. Please try again later.');
        } catch (finalError) {
          console.error('❌ Final fallback message also failed:', finalError.message);
        }
      }
    }
  }

  /**
   * Extract content from interactive messages (buttons/lists)
   * @param {Object} message - Interactive message object
   * @returns {string} Extracted content
   */
  extractInteractiveContent(message) {
    if (message.interactive?.type === 'button_reply') {
      return message.interactive.button_reply.title || message.interactive.button_reply.id;
    } else if (message.interactive?.type === 'list_reply') {
      return message.interactive.list_reply.title || message.interactive.list_reply.id;
    }
    
    return 'Interactive response';
  }

  /**
   * Extract contact information from contacts array
   * @param {Array} contacts - Contacts array from webhook
   * @param {string} userPhone - User's phone number
   * @returns {Object|null} Contact information
   */
  extractContactInfo(contacts, userPhone) {
    if (!contacts || !Array.isArray(contacts)) {
      return null;
    }
    
    return contacts.find(contact => contact.wa_id === userPhone);
  }

  /**
   * Send response to user based on conversation manager's response
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response from conversation manager
   */
  async sendResponseToUser(userPhone, response) {
    try {
      console.log('📤 Sending response:', { type: response.type, hasMessage: !!response.message });

      // Validate response object
      if (!response || !response.message) {
        console.warn('⚠️ Invalid response object, using fallback');
        await whatsappService.sendTextMessage(userPhone, 'I\'m processing your request. Please wait a moment.');
        return;
      }

      switch (response.type) {
        case 'flight_results':
          // Send flight results with interactive buttons if needed
          await this.sendFlightResults(userPhone, response);
          break;
          
        case 'flight_selected':
          // Send booking confirmation
          await whatsappService.sendTextMessage(userPhone, response.message);
          break;
          
        case 'help':
        case 'greeting':
        case 'parsing_help':
          // Send help/greeting messages
          await whatsappService.sendTextMessage(userPhone, response.message);
          break;
          
        case 'error':
        case 'search_error':
        case 'selection_error':
          // Send error messages
          await whatsappService.sendTextMessage(userPhone, response.message);
          break;
          
        default:
          // Send default text response
          if (response.message) {
            await whatsappService.sendTextMessage(userPhone, response.message);
          } else {
            await whatsappService.sendTextMessage(userPhone, 'I understand your message. How can I help you with flight bookings?');
          }
      }
      
      console.log('✅ Response sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending response to user:', {
        error: error.message,
        userPhone,
        responseType: response?.type,
        hasMessage: !!response?.message
      });
      
      // Enhanced fallback with retry logic
      const fallbackMessages = [
        'Sorry, I encountered an error sending the response. Please try again.',
        'I\'m having technical difficulties. Please resend your message.',
        'Service temporarily unavailable. Please try again in a moment.'
      ];
      
      for (let i = 0; i < fallbackMessages.length; i++) {
        try {
          await whatsappService.sendTextMessage(userPhone, fallbackMessages[i]);
          console.log(`✅ Fallback message ${i + 1} sent successfully`);
          break;
        } catch (fallbackError) {
          console.error(`❌ Fallback message ${i + 1} failed:`, fallbackError.message);
          if (i === fallbackMessages.length - 1) {
            console.error('❌ All fallback attempts failed');
          }
        }
      }
    }
  }

  /**
   * Send flight results with enhanced formatting
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response containing flight results
   */
  async sendFlightResults(userPhone, response) {
    try {
      // Send main flight results message
      await whatsappService.sendTextMessage(userPhone, response.message);
      
      // If there are flights, optionally send quick action buttons
      if (response.searchResults && response.searchResults.length > 0) {
        const buttonOptions = response.searchResults.slice(0, 3).map((flight, index) => ({
          title: `Select ${index + 1}`,
          payload: `select_${index + 1}`
        }));
        
        // Try to send interactive buttons, fallback to text if not supported
        try {
          await whatsappService.sendButtonMessage(
            userPhone,
            'Quick Actions:',
            buttonOptions
          );
        } catch (buttonError) {
          console.log('🔘 Button message failed, sent text instead');
        }
      }
      
    } catch (error) {
      console.error('❌ Error sending flight results:', error);
      throw error;
    }
  }

  /**
   * Send response for unsupported message types
   * @param {string} userPhone - User's phone number
   */
  async sendUnsupportedTypeResponse(userPhone) {
    const message = 'I can only process text messages right now. Please send your flight search as text.\n\nExample: "Mumbai to Delhi tomorrow"';
    
    try {
      await whatsappService.sendTextMessage(userPhone, message);
    } catch (error) {
      console.error('❌ Failed to send unsupported type response:', error);
    }
  }

  /**
   * Send typing indicator to user
   * @param {string} userPhone - User's phone number
   */
  async sendTypingIndicator(userPhone) {
    try {
      await whatsappService.sendTypingIndicator(userPhone);
    } catch (error) {
      console.warn('⚠️ Typing indicator failed:', error.message);
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID to mark as read
   */
  async markMessageAsRead(messageId) {
    try {
      await whatsappService.markMessageAsRead(messageId);
      console.log('✅ Message marked as read:', messageId);
    } catch (error) {
      console.warn('⚠️ Failed to mark message as read:', error.message);
    }
  }

  /**
   * Health check for the controller
   * @returns {Object} Health check result
   */
  async healthCheck() {
    try {
      const whatsappHealth = await whatsappService.healthCheck();
      const sessionStats = conversationManager.getSessionStats();
      
      return {
        status: 'healthy',
        controller: 'WhatsAppController',
        timestamp: new Date().toISOString(),
        whatsapp: whatsappHealth,
        conversations: {
          total: sessionStats.totalSessions,
          active: sessionStats.activeSessions,
          states: sessionStats.stateDistribution
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        controller: 'WhatsAppController',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get conversation statistics
   * @returns {Object} Conversation statistics
   */
  getConversationStats() {
    return conversationManager.getSessionStats();
  }

  /**
   * Clean expired conversations
   * @returns {number} Number of cleaned sessions
   */
  cleanExpiredSessions() {
    return conversationManager.cleanExpiredSessions();
  }

  /**
   * Handle webhook verification (for backward compatibility)
   * @param {Object} webhookData - Webhook data
   */
  async handleWebhook(webhookData) {
    console.log('🔄 handleWebhook called - redirecting to handleIncomingMessage');
    
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

  /**
   * Process test message (for development/testing)
   * @param {string} userPhone - User's phone number
   * @param {string} message - Test message
   * @returns {Object} Processing result
   */
  async processTestMessage(userPhone, message) {
    try {
      const mockMessage = {
        id: `test_${Date.now()}`,
        from: userPhone,
        type: 'text',
        timestamp: Math.floor(Date.now() / 1000).toString(),
        text: { body: message }
      };

      const mockChangeValue = {
        metadata: { phone_number_id: 'test_phone_id' },
        contacts: [{
          wa_id: userPhone,
          profile: { name: 'Test User' }
        }],
        messages: [mockMessage]
      };

      await this.processIndividualMessage(mockMessage, mockChangeValue, 'test_phone_id');
      
      return {
        success: true,
        message: 'Test message processed successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export an instance of the class
module.exports = new WhatsAppController();