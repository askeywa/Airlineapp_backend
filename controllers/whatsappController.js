// Enhanced WhatsApp Controller with comprehensive debugging and error handling
// controllers/whatsappController.js

const whatsappService = require('../services/whatsappService');
const conversationManager = require('../services/conversationManager');
const messageFormatter = require('../services/messageFormatter');
const messageParser = require('../services/messageParser');

class WhatsAppController {
  
  constructor() {
    // Statistics tracking
    this.messageCount = 0;
    this.statusCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    
    // Performance metrics
    this.processingTimes = [];
    this.averageProcessingTime = 0;
    
    // Error tracking
    this.errorLog = [];
    this.maxErrorLogSize = 100;
    
    console.log('✅ WhatsApp Controller initialized with enhanced debugging');
  }

  /**
   * Handle incoming WhatsApp messages - ENHANCED VERSION with comprehensive debugging
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleIncomingMessage(req, res) {
    const processingStartTime = Date.now();
    
    try {
      console.log('🎯 ===== PROCESSING INCOMING MESSAGE =====');
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('🌍 Webhook URL: https://airlineapp-backend.onrender.com/webhook');
      console.log('📊 Current Stats:', this.getQuickStats());
      
      const body = req.body;
      
      // Log request details for debugging
      console.log('🔧 Request Details:', {
        method: req.method,
        url: req.url,
        headers: {
          'content-type': req.get('content-type'),
          'user-agent': req.get('user-agent'),
          'x-hub-signature-256': req.get('x-hub-signature-256') ? 'Present' : 'Missing'
        },
        bodySize: JSON.stringify(body).length
      });
      
      console.log('📨 Raw webhook body:', JSON.stringify(body, null, 2));
      
      // Immediately respond to WhatsApp to prevent timeouts
      if (res && !res.headersSent) {
        res.status(200).send('OK');
        console.log('✅ Quick response sent to Meta (prevented timeout)');
      }
      
      // Enhanced validation of webhook data structure
      if (!this.validateWebhookStructure(body)) {
        console.log('❌ Invalid webhook structure received');
        this.logError('Invalid webhook structure', { body });
        return;
      }

      // Process each entry from WhatsApp
      const processingPromises = [];
      for (const entry of body.entry) {
        processingPromises.push(this.processWebhookEntry(entry));
      }
      
      // Wait for all entries to be processed
      await Promise.all(processingPromises);

      // Update performance metrics
      const processingTime = Date.now() - processingStartTime;
      this.updatePerformanceMetrics(processingTime);

      console.log('✅ Finished processing all webhook entries');
      console.log(`⚡ Total processing time: ${processingTime}ms`);
      this.logStatistics();
      
    } catch (error) {
      const processingTime = Date.now() - processingStartTime;
      console.error('❌ Error handling incoming message:', error);
      console.error('📍 Error stack:', error.stack);
      console.error(`⚡ Failed after: ${processingTime}ms`);
      
      this.logError('handleIncomingMessage failed', error, {
        processingTime,
        bodyPresent: !!req.body,
        method: req.method
      });
      
      this.errorCount++;
      
      // Ensure response is sent if not already done
      if (res && !res.headersSent) {
        res.status(200).send('OK');
      }
    }
  }

  /**
   * Enhanced webhook structure validation with detailed logging
   * @param {Object} body - Webhook body
   * @returns {boolean} True if valid
   */
  validateWebhookStructure(body) {
    console.log('🔍 Validating webhook structure...');
    
    if (!body) {
      console.log('❌ No body received');
      return false;
    }

    // Log the complete structure for debugging
    console.log('📋 Webhook body analysis:', {
      object: body.object,
      hasEntry: !!body.entry,
      isEntryArray: Array.isArray(body.entry),
      entryLength: body.entry ? body.entry.length : 0,
      bodyKeys: Object.keys(body),
      bodyType: typeof body
    });

    if (!body.entry || !Array.isArray(body.entry) || body.entry.length === 0) {
      console.log('❌ No valid entry data found in request');
      console.log('📊 Detailed validation failure:', {
        hasEntry: !!body.entry,
        isEntryArray: Array.isArray(body.entry),
        entryLength: body.entry ? body.entry.length : 0,
        object: body.object,
        fullBody: JSON.stringify(body, null, 2)
      });
      return false;
    }

    // Validate each entry structure
    for (let i = 0; i < body.entry.length; i++) {
      const entry = body.entry[i];
      console.log(`🔍 Validating entry ${i + 1}:`, {
        id: entry.id,
        hasChanges: !!entry.changes,
        changesCount: entry.changes ? entry.changes.length : 0
      });
      
      if (!entry.id) {
        console.log(`❌ Entry ${i + 1} missing ID`);
        return false;
      }
      
      if (!entry.changes || !Array.isArray(entry.changes)) {
        console.log(`❌ Entry ${i + 1} has invalid changes structure`);
        return false;
      }
    }

    console.log('✅ Webhook structure validation passed');
    return true;
  }

  /**
   * Enhanced webhook entry processing with detailed logging
   * @param {Object} entry - Webhook entry
   */
  async processWebhookEntry(entry) {
    try {
      console.log('🔄 ===== PROCESSING WEBHOOK ENTRY =====');
      console.log('🆔 Entry ID:', entry.id);
      console.log('📊 Entry structure:', {
        id: entry.id,
        hasChanges: !!entry.changes,
        changesCount: entry.changes ? entry.changes.length : 0,
        changesArray: Array.isArray(entry.changes),
        time: entry.time
      });
      
      if (!entry.changes || !Array.isArray(entry.changes)) {
        console.log('⚠️ No changes found in entry');
        return;
      }

      // Process each change
      const changePromises = [];
      for (let i = 0; i < entry.changes.length; i++) {
        const change = entry.changes[i];
        console.log(`🔄 Queuing change ${i + 1}/${entry.changes.length}`);
        changePromises.push(this.processWebhookChange(change, i + 1));
      }
      
      await Promise.all(changePromises);
      console.log('✅ Completed processing entry:', entry.id);
      
    } catch (error) {
      console.error('❌ Error processing webhook entry:', error);
      this.logError('processWebhookEntry failed', error, { entryId: entry.id });
      this.errorCount++;
    }
  }

  /**
   * Enhanced webhook change processing with comprehensive analysis
   * @param {Object} change - Webhook change
   * @param {number} changeIndex - Index of change for logging
   */
  async processWebhookChange(change, changeIndex = 1) {
    try {
      console.log(`🔄 ===== PROCESSING CHANGE ${changeIndex} =====`);
      console.log('📝 Change field:', change.field);
      console.log('✅ Has value:', !!change.value);
      
      // Log the complete change structure for debugging
      console.log('📊 Complete change analysis:', {
        field: change.field,
        hasValue: !!change.value,
        valueType: typeof change.value,
        valueKeys: change.value ? Object.keys(change.value) : []
      });
      
      // Enhanced change logging (truncated for readability)
      const truncatedChange = this.truncateForLogging(change);
      console.log('🔍 Change object (truncated):', JSON.stringify(truncatedChange, null, 2));
      
      // Only process message changes
      if (change.field !== 'messages') {
        console.log('⏩ Skipping non-message change:', change.field);
        return;
      }

      if (!change.value) {
        console.log('⚠️ No value found in change');
        return;
      }

      const changeValue = change.value;
      const phoneNumberId = changeValue.metadata?.phone_number_id;
      
      console.log('📱 Phone number ID from metadata:', phoneNumberId);
      
      // Enhanced logging of change value structure
      console.log('📊 Detailed change value analysis:', {
        hasMessages: !!changeValue.messages,
        hasStatuses: !!changeValue.statuses,
        hasMetadata: !!changeValue.metadata,
        hasContacts: !!changeValue.contacts,
        hasErrors: !!changeValue.errors,
        messageCount: changeValue.messages ? changeValue.messages.length : 0,
        statusCount: changeValue.statuses ? changeValue.statuses.length : 0,
        contactCount: changeValue.contacts ? changeValue.contacts.length : 0,
        messagingProduct: changeValue.messaging_product,
        displayPhoneNumber: changeValue.metadata?.display_phone_number
      });

      // Process messages if they exist
      if (changeValue.messages && Array.isArray(changeValue.messages) && changeValue.messages.length > 0) {
        console.log(`✅ Found ${changeValue.messages.length} messages to process`);
        
        for (let i = 0; i < changeValue.messages.length; i++) {
          const message = changeValue.messages[i];
          this.messageCount++;
          
          console.log(`📨 Processing message ${i + 1}/${changeValue.messages.length} (Total: ${this.messageCount}):`, {
            id: message.id,
            from: message.from,
            type: message.type,
            timestamp: message.timestamp,
            readableTime: new Date(parseInt(message.timestamp) * 1000).toISOString()
          });
          
          // Process each message with enhanced error handling
          this.processIndividualMessage(message, changeValue, phoneNumberId)
            .catch(error => {
              console.error(`❌ Error in async message processing (Message ${i + 1}):`, error);
              this.logError('Individual message processing failed', error, {
                messageId: message.id,
                from: message.from,
                messageIndex: i + 1
              });
              this.errorCount++;
            });
        }
      } 
      // Process status updates (read receipts, delivery confirmations)
      else if (changeValue.statuses && Array.isArray(changeValue.statuses) && changeValue.statuses.length > 0) {
        console.log(`📊 Processing ${changeValue.statuses.length} status updates`);
        this.processStatusUpdates(changeValue.statuses);
      } 
      // Handle case where we have neither messages nor statuses
      else {
        console.log('⚠️ No messages or statuses found in change value');
        console.log('🔍 Unknown webhook type analysis:');
        this.analyzeUnknownWebhookType(changeValue);
      }
      
    } catch (error) {
      console.error(`❌ Error processing webhook change ${changeIndex}:`, error);
      this.logError('processWebhookChange failed', error, { changeIndex });
      this.errorCount++;
    }
  }

  /**
   * Analyze unknown webhook types for comprehensive debugging
   * @param {Object} changeValue - Change value to analyze
   */
  analyzeUnknownWebhookType(changeValue) {
    console.log('🔍 ===== ANALYZING UNKNOWN WEBHOOK TYPE =====');
    
    const keys = Object.keys(changeValue);
    console.log('📋 Available keys in change value:', keys);
    console.log('📊 Change value structure:', {
      keyCount: keys.length,
      messagingProduct: changeValue.messaging_product,
      hasMetadata: !!changeValue.metadata,
      metadataKeys: changeValue.metadata ? Object.keys(changeValue.metadata) : []
    });
    
    // Analyze each key in detail
    keys.forEach(key => {
      const value = changeValue[key];
      console.log(`🔍 Key "${key}":`, {
        type: typeof value,
        isArray: Array.isArray(value),
        length: Array.isArray(value) ? value.length : undefined,
        hasValue: value != null,
        value: this.truncateForLogging(value)
      });
    });
    
    // Check for common webhook types
    if (changeValue.messaging_product === 'whatsapp') {
      console.log('✅ Confirmed WhatsApp webhook');
      
      if (keys.includes('messages')) {
        console.log('📨 Has messages key but array is empty or invalid:', {
          messagesType: typeof changeValue.messages,
          messagesArray: Array.isArray(changeValue.messages),
          messagesLength: changeValue.messages ? changeValue.messages.length : 0
        });
      }
      
      if (keys.includes('statuses')) {
        console.log('📊 Has statuses key:', {
          statusesType: typeof changeValue.statuses,
          statusesArray: Array.isArray(changeValue.statuses),
          statusesLength: changeValue.statuses ? changeValue.statuses.length : 0,
          statuses: changeValue.statuses
        });
      }
      
      if (keys.includes('errors')) {
        console.log('❌ Webhook contains errors:', changeValue.errors);
      }
    } else {
      console.log('❓ Unknown messaging product:', changeValue.messaging_product);
    }
    
    console.log('='.repeat(50));
  }

  /**
   * Process status updates with detailed logging
   * @param {Array} statuses - Array of status updates
   */
  processStatusUpdates(statuses) {
    console.log('📊 ===== PROCESSING STATUS UPDATES =====');
    
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      this.statusCount++;
      
      console.log(`📊 Status ${i + 1}/${statuses.length} (Total: ${this.statusCount}):`, {
        id: status.id,
        status: status.status,
        recipient_id: status.recipient_id,
        timestamp: status.timestamp,
        readableTime: new Date(parseInt(status.timestamp) * 1000).toISOString(),
        conversation: status.conversation,
        pricing: status.pricing
      });
      
      // Enhanced status interpretation
      switch (status.status) {
        case 'sent':
          console.log('📤 Message was sent successfully');
          break;
        case 'delivered':
          console.log('📬 Message was delivered to recipient');
          break;
        case 'read':
          console.log('👀 Message was read by recipient');
          break;
        case 'failed':
          console.log('❌ Message delivery failed');
          if (status.errors) {
            console.log('🚨 Error details:', status.errors);
            this.logError('Message delivery failed', status.errors, { statusId: status.id });
          }
          break;
        default:
          console.log(`❓ Unknown status: ${status.status}`);
      }
    }
    
    console.log('✅ Finished processing status updates');
  }

  /**
   * Enhanced individual message processing with comprehensive debugging
   * @param {Object} message - Message object
   * @param {Object} changeValue - Change value containing metadata
   * @param {string} phoneNumberId - Phone number ID
   */
  async processIndividualMessage(message, changeValue, phoneNumberId) {
    const messageStartTime = Date.now();
    
    try {
      console.log('💬 ===== PROCESSING INDIVIDUAL MESSAGE =====');
      
      const userPhone = message.from;
      const messageId = message.id;
      const messageType = message.type;
      const timestamp = message.timestamp;
      
      console.log('📋 Complete message analysis:', {
        from: userPhone,
        id: messageId,
        type: messageType,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        rawTimestamp: timestamp,
        phoneNumberId: phoneNumberId,
        hasContext: !!message.context,
        context: message.context,
        referral: message.referral
      });

      // Enhanced message content extraction with debugging
      let messageContent = this.extractMessageContent(message);
      console.log('💬 Extracted message content:', {
        content: messageContent,
        contentLength: messageContent ? messageContent.length : 0,
        contentType: typeof messageContent
      });

      if (!messageContent) {
        console.log('⚠️ No valid message content found, sending unsupported type response');
        await this.sendUnsupportedTypeResponse(userPhone, messageType);
        return;
      }

      // Get contact information with enhanced logging
      const contact = this.extractContactInfo(changeValue.contacts, userPhone);
      const userName = contact?.profile?.name || contact?.name || 'User';
      
      console.log('👤 User information:', {
        userName,
        phone: userPhone,
        contact: contact,
        profileName: contact?.profile?.name,
        waId: contact?.wa_id
      });

      // Test message parsing with detailed analysis
      console.log('🧠 ===== MESSAGE PARSING ANALYSIS =====');
      const parseResult = messageParser.parseFlightQuery(messageContent);
      console.log('📊 Detailed parse result:', {
        confidence: parseResult.confidence,
        origin: parseResult.origin,
        destination: parseResult.destination,
        departureDate: parseResult.departureDate,
        returnDate: parseResult.returnDate,
        adults: parseResult.adults,
        messageType: parseResult.messageType,
        isRoundTrip: parseResult.isRoundTrip
      });

      // Generate suggestions if confidence is low
      if (parseResult.confidence < 0.7 && messageParser.generateSuggestions) {
        const suggestions = messageParser.generateSuggestions(parseResult);
        console.log('💡 Parser suggestions:', suggestions);
      }

      // Mark message as read (async, non-blocking)
      this.markMessageAsRead(messageId).catch(error => {
        console.warn('⚠️ Failed to mark message as read:', error.message);
      });

      // Send typing indicator (async, non-blocking)
      this.sendTypingIndicator(userPhone).catch(error => {
        console.warn('⚠️ Failed to send typing indicator:', error.message);
      });

      // Process message through conversation manager or direct parsing
      const context = {
        userName,
        messageId,
        messageType,
        timestamp,
        parseResult,
        phoneNumberId
      };

      let response;
      if (conversationManager && typeof conversationManager.processMessage === 'function') {
        console.log('🤖 Processing through conversation manager...');
        response = await conversationManager.processMessage(userPhone, messageContent, context);
      } else {
        console.log('🔄 Using fallback processing (conversation manager unavailable)...');
        response = this.createResponseFromParseResult(parseResult, messageContent);
      }
      
      console.log('📤 Generated response:', {
        type: response?.type,
        hasMessage: !!response?.message,
        messageLength: response?.message?.length
      });

      // Send response based on processing result
      await this.sendResponseToUser(userPhone, response);

      const messageProcessingTime = Date.now() - messageStartTime;
      console.log('✅ Message processing completed successfully');
      console.log(`⚡ Message processing time: ${messageProcessingTime}ms`);
      
    } catch (error) {
      const messageProcessingTime = Date.now() - messageStartTime;
      console.error('❌ Error processing individual message:', error);
      console.error('📍 Error details:', {
        message: error.message,
        stack: error.stack,
        userPhone: message?.from,
        messageId: message?.id,
        messageType: message?.type,
        processingTime: messageProcessingTime
      });
      
      this.logError('processIndividualMessage failed', error, {
        userPhone: message?.from,
        messageId: message?.id,
        messageType: message?.type,
        processingTime: messageProcessingTime
      });
      
      // Send error response to user with enhanced fallback
      await this.handleMessageProcessingError(message.from, error);
    }
  }

  /**
   * Enhanced message content extraction with comprehensive debugging
   * @param {Object} message - Message object
   * @returns {string|null} Extracted content or null
   */
  extractMessageContent(message) {
    const messageType = message.type;
    let messageContent = '';
    
    console.log('🔍 ===== MESSAGE CONTENT EXTRACTION =====');
    console.log('📝 Message type:', messageType);
    console.log('🔍 Full message structure:', this.truncateForLogging(message));

    switch (messageType) {
      case 'text':
        if (message.text && message.text.body) {
          messageContent = message.text.body.trim();
          console.log('✅ Extracted text content:', {
            content: messageContent,
            originalLength: message.text.body.length,
            trimmedLength: messageContent.length
          });
        } else {
          console.log('❌ Text message missing body:', {
            hasText: !!message.text,
            textKeys: message.text ? Object.keys(message.text) : []
          });
        }
        break;
        
      case 'interactive':
        messageContent = this.extractInteractiveContent(message);
        console.log('✅ Extracted interactive content:', {
          content: messageContent,
          interactiveType: message.interactive?.type
        });
        break;
        
      case 'image':
        console.log('🖼️ Image message received:', {
          id: message.image?.id,
          mimeType: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption
        });
        return null;
        
      case 'document':
        console.log('📄 Document message received:', {
          id: message.document?.id,
          filename: message.document?.filename,
          mimeType: message.document?.mime_type,
          caption: message.document?.caption
        });
        return null;
        
      case 'audio':
        console.log('🎵 Audio message received:', {
          id: message.audio?.id,
          mimeType: message.audio?.mime_type
        });
        return null;
        
      case 'video':
        console.log('🎥 Video message received:', {
          id: message.video?.id,
          mimeType: message.video?.mime_type,
          caption: message.video?.caption
        });
        return null;
        
      case 'location':
        console.log('📍 Location message received:', {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address
        });
        return null;
        
      case 'contacts':
        console.log('👥 Contacts message received:', {
          contactCount: message.contacts ? message.contacts.length : 0
        });
        return null;
        
      default:
        console.log('❓ Unknown message type:', messageType);
        return null;
    }

    console.log('📊 Content extraction result:', {
      extracted: !!messageContent,
      contentLength: messageContent ? messageContent.length : 0,
      isEmpty: !messageContent || messageContent.length === 0
    });

    return messageContent || null;
  }

  /**
   * Enhanced interactive content extraction
   * @param {Object} message - Interactive message
   * @returns {string} Extracted content
   */
  extractInteractiveContent(message) {
    console.log('🔍 Extracting interactive content:', {
      type: message.interactive?.type,
      hasButtonReply: !!message.interactive?.button_reply,
      hasListReply: !!message.interactive?.list_reply
    });

    if (message.interactive?.type === 'button_reply') {
      const buttonReply = message.interactive.button_reply;
      console.log('🔘 Button reply:', buttonReply);
      return buttonReply.title || buttonReply.id || 'Button pressed';
    } else if (message.interactive?.type === 'list_reply') {
      const listReply = message.interactive.list_reply;
      console.log('📋 List reply:', listReply);
      return listReply.title || listReply.id || 'List item selected';
    }
    
    console.log('❓ Unknown interactive type');
    return 'Interactive response';
  }

  /**
   * Create response from parse result with enhanced logic
   * @param {Object} parseResult - Parser result
   * @param {string} originalMessage - Original message
   * @returns {Object} Response object
   */
  createResponseFromParseResult(parseResult, originalMessage) {
    console.log('🏗️ Creating response from parse result:', {
      confidence: parseResult.confidence,
      hasOrigin: !!parseResult.origin,
      hasDestination: !!parseResult.destination,
      hasDate: !!parseResult.departureDate
    });

    if (parseResult.confidence > 0.7) {
      return {
        type: 'flight_search_confirmation',
        message: `I found your flight search request:\n\n` +
                `✈️ From: ${parseResult.origin || 'Not specified'}\n` +
                `🎯 To: ${parseResult.destination || 'Not specified'}\n` +
                `📅 Date: ${parseResult.departureDate || 'Not specified'}\n` +
                `👥 Passengers: ${parseResult.adults || 1}\n\n` +
                `I would search for flights now, but my flight service needs to be connected. ` +
                `Please ensure the Amadeus API is properly configured.`,
        confidence: parseResult.confidence,
        searchParams: parseResult
      };
    } else if (parseResult.confidence > 0.3) {
      const suggestions = messageParser.generateSuggestions ? 
        messageParser.generateSuggestions(parseResult) : 
        ['Please provide departure city', 'Please provide destination city', 'Please provide travel date'];
      
      return {
        type: 'parsing_help',
        message: `I partially understood your request:\n\n${this.formatParsedDetails(parseResult)}\n\n` +
                `To help you better, please provide:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\n` +
                `Example: "Mumbai to Delhi tomorrow for 2 passengers"`,
        confidence: parseResult.confidence,
        suggestions: suggestions
      };
    } else {
      return {
        type: 'help',
        message: `I'd be happy to help you search for flights! ✈️\n\n` +
                `Please try formats like:\n` +
                `• Mumbai to Delhi tomorrow\n` +
                `• BOM to DEL on 25th Dec for 2 passengers\n` +
                `• Flight from NYC to London on 2025-01-15\n` +
                `• Round trip Mumbai to Bangkok Jan 15 return Jan 25\n\n` +
                `What flight are you looking for?`,
        confidence: parseResult.confidence,
        examples: messageParser.getExampleQueries ? messageParser.getExampleQueries() : []
      };
    }
  }

  /**
   * Format parsed details for user display
   * @param {Object} parseResult - Parse result
   * @returns {string} Formatted details
   */
  formatParsedDetails(parseResult) {
    const details = [];
    
    if (parseResult.origin) {
      details.push(`✅ From: ${parseResult.origin}`);
    } else {
      details.push(`❌ From: Not specified`);
    }
    
    if (parseResult.destination) {
      details.push(`✅ To: ${parseResult.destination}`);
    } else {
      details.push(`❌ To: Not specified`);
    }
    
    if (parseResult.departureDate) {
      details.push(`✅ Date: ${parseResult.departureDate}`);
    } else {
      details.push(`❌ Date: Not specified`);
    }
    
    if (parseResult.adults > 1) {
      details.push(`✅ Passengers: ${parseResult.adults}`);
    }
    
    return details.join('\n') || '❌ No clear flight details found';
  }

  /**
   * Enhanced error handling for message processing
   * @param {string} userPhone - User's phone number
   * @param {Error} error - Error object
   */
  async handleMessageProcessingError(userPhone, error) {
    console.log('🚨 ===== HANDLING MESSAGE PROCESSING ERROR =====');
    console.log('🔍 Error analysis:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      userPhone: userPhone
    });
    
    const errorMessages = [
      {
        message: 'Sorry, I encountered an error processing your message. Please try again.',
        retryable: true
      },
      {
        message: 'I\'m having technical difficulties. Please resend your message in a moment.',
        retryable: true
      },
      {
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: false
      }
    ];
    
    for (let i = 0; i < errorMessages.length; i++) {
      try {
        if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
          await whatsappService.sendTextMessage(userPhone, errorMessages[i].message);
          console.log(`✅ Error message ${i + 1} sent successfully`);
          break;
        } else {
          console.log('⚠️ WhatsApp service not available, cannot send error message');
          break;
        }
      } catch (sendError) {
        console.error(`❌ Error message ${i + 1} failed:`, sendError.message);
        this.logError(`Error message ${i + 1} send failed`, sendError, { userPhone, attempt: i + 1 });
        
        if (i === errorMessages.length - 1) {
          console.error('❌ All error message attempts failed');
        }
      }
    }
  }

  /**
   * Extract contact information with enhanced logging
   * @param {Array} contacts - Contacts array
   * @param {string} userPhone - User's phone number
   * @returns {Object|null} Contact information
   */
  extractContactInfo(contacts, userPhone) {
    console.log('👤 Extracting contact info:', {
      contactsProvided: !!contacts,
      contactsArray: Array.isArray(contacts),
      contactsCount: contacts ? contacts.length : 0,
      userPhone: userPhone
    });

    if (!contacts || !Array.isArray(contacts)) {
      console.log('❌ No valid contacts array provided');
      return null;
    }
    
    const contact = contacts.find(contact => contact.wa_id === userPhone);
    console.log('👤 Contact search result:', {
      found: !!contact,
      contact: contact,
      allContacts: contacts.map(c => ({ wa_id: c.wa_id, name: c.profile?.name }))
    });
    
    return contact;
  }

  /**
   * Enhanced response sending with detailed logging
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response object
   */
  async sendResponseToUser(userPhone, response) {
    try {
      console.log('📤 ===== SENDING RESPONSE TO USER =====');
      console.log('📊 Response analysis:', {
        type: response?.type,
        hasMessage: !!response?.message,
        messageLength: response?.message?.length,
        confidence: response?.confidence,
        userPhone: userPhone
      });

      if (!response || !response.message) {
        console.warn('⚠️ Invalid response object, using fallback');
        if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
          await whatsappService.sendTextMessage(userPhone, 'I\'m processing your request. Please wait a moment.');
          console.log('✅ Fallback message sent');
        }
        return;
      }

      // Enhanced response handling based on type
      switch (response.type) {
        case 'flight_results':
          await this.sendFlightResults(userPhone, response);
          break;
          
        case 'flight_search_confirmation':
          await this.sendSearchConfirmation(userPhone, response);
          break;
          
        case 'parsing_help':
          await this.sendParsingHelp(userPhone, response);
          break;
          
        case 'help':
        case 'greeting':
          await this.sendHelpMessage(userPhone, response);
          break;
          
        case 'error':
        case 'search_error':
        case 'selection_error':
          await this.sendErrorMessage(userPhone, response);
          break;
          
        default:
          // Send default text response
          if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
            await whatsappService.sendTextMessage(userPhone, response.message);
            console.log('✅ Default text response sent');
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
      
      this.logError('sendResponseToUser failed', error, {
          userPhone, 
        responseType: response?.type
      });
      
      // Enhanced fallback with multiple attempts
      await this.handleResponseSendError(userPhone, error);
    }
  }

  /**
   * Send flight search confirmation
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response object
   */
  async sendSearchConfirmation(userPhone, response) {
    console.log('✈️ Sending flight search confirmation...');
    
    if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
      await whatsappService.sendTextMessage(userPhone, response.message);
      
      // Optionally send additional helpful information
      const additionalInfo = `💡 *Next Steps:*\n` +
                            `• I'll search for flights once my booking system is connected\n` +
                            `• You can modify your search by sending a new message\n` +
                            `• Type "help" for more options`;
      
      setTimeout(async () => {
        try {
          await whatsappService.sendTextMessage(userPhone, additionalInfo);
        } catch (error) {
          console.warn('⚠️ Failed to send additional info:', error.message);
        }
      }, 1000);
    }
  }

  /**
   * Send parsing help message
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response object
   */
  async sendParsingHelp(userPhone, response) {
    console.log('💡 Sending parsing help...');
    
    if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
      await whatsappService.sendTextMessage(userPhone, response.message);
    }
  }

  /**
   * Send help message
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response object
   */
  async sendHelpMessage(userPhone, response) {
    console.log('❓ Sending help message...');
    
    if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
      await whatsappService.sendTextMessage(userPhone, response.message);
    }
  }

  /**
   * Send error message
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response object
   */
  async sendErrorMessage(userPhone, response) {
    console.log('🚨 Sending error message...');
    
    if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
      await whatsappService.sendTextMessage(userPhone, response.message);
    }
  }

  /**
   * Send flight results with enhanced formatting
   * @param {string} userPhone - User's phone number
   * @param {Object} response - Response containing flight results
   */
  async sendFlightResults(userPhone, response) {
    try {
      console.log('✈️ Sending flight results...');
      
      // Send main flight results message
      if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
      await whatsappService.sendTextMessage(userPhone, response.message);
      }
      
      // If there are flights, optionally send quick action buttons
      if (response.searchResults && response.searchResults.length > 0) {
        const buttonOptions = response.searchResults.slice(0, 3).map((flight, index) => ({
          title: `Select ${index + 1}`,
          payload: `select_${index + 1}`
        }));
        
        // Try to send interactive buttons, fallback to text if not supported
        try {
          if (whatsappService && typeof whatsappService.sendButtonMessage === 'function') {
          await whatsappService.sendButtonMessage(
            userPhone,
            'Quick Actions:',
            buttonOptions
          );
          }
        } catch (buttonError) {
          console.log('📘 Button message not supported, using text alternative');
          const buttonText = `Quick Actions:\n${buttonOptions.map((btn, i) => `${i + 1}. ${btn.title}`).join('\n')}`;
          if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
            await whatsappService.sendTextMessage(userPhone, buttonText);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error sending flight results:', error);
      throw error;
    }
  }

  /**
   * Handle response send errors with fallback options
   * @param {string} userPhone - User's phone number
   * @param {Error} error - Original error
   */
  async handleResponseSendError(userPhone, error) {
    console.log('🚨 Handling response send error...');
    
    const fallbackMessages = [
      'I understand your message but had trouble responding. Please try again.',
      'Technical difficulty sending response. Please resend your request.',
      'Service issue detected. Please try your request again.'
    ];
    
    for (let i = 0; i < fallbackMessages.length; i++) {
      try {
        if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
          await whatsappService.sendTextMessage(userPhone, fallbackMessages[i]);
          console.log(`✅ Fallback response ${i + 1} sent successfully`);
          break;
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback response ${i + 1} failed:`, fallbackError.message);
        if (i === fallbackMessages.length - 1) {
          console.error('❌ All fallback response attempts failed');
        }
      }
    }
  }

  /**
   * Send response for unsupported message types
   * @param {string} userPhone - User's phone number
   * @param {string} messageType - Type of unsupported message
   */
  async sendUnsupportedTypeResponse(userPhone, messageType) {
    const messages = {
      'image': 'I can see you sent an image, but I can only process text messages for flight searches. Please describe your flight requirements in text.',
      'document': 'I received your document, but I can only process text messages for flight searches. Please type your flight request.',
      'audio': 'I received your voice message, but I can only process text messages for flight searches. Please type your request.',
      'video': 'I received your video, but I can only process text messages for flight searches. Please send your flight request as text.',
      'location': 'Thanks for sharing your location! However, I need text messages to search for flights. Please type your flight request.',
      'contacts': 'I received contact information, but I need text messages for flight searches. Please type your flight request.',
      'default': 'I can only process text messages for flight searches. Please type your request.'
    };
    
    const message = messages[messageType] || messages['default'];
    const fullMessage = `${message}\n\nExample: "Mumbai to Delhi tomorrow for 2 passengers"`;
    
    try {
      if (whatsappService && typeof whatsappService.sendTextMessage === 'function') {
        await whatsappService.sendTextMessage(userPhone, fullMessage);
        console.log(`✅ Unsupported type response sent for: ${messageType}`);
      }
    } catch (error) {
      console.error('❌ Failed to send unsupported type response:', error);
    }
  }

  /**
   * Send typing indicator
   * @param {string} userPhone - User's phone number
   */
  async sendTypingIndicator(userPhone) {
    try {
      if (whatsappService && typeof whatsappService.sendTypingIndicator === 'function') {
      await whatsappService.sendTypingIndicator(userPhone);
        console.log('⌨️ Typing indicator sent');
      }
    } catch (error) {
      console.warn('⚠️ Typing indicator failed:', error.message);
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   */
  async markMessageAsRead(messageId) {
    try {
      if (whatsappService && typeof whatsappService.markMessageAsRead === 'function') {
      await whatsappService.markMessageAsRead(messageId);
      console.log('✅ Message marked as read:', messageId);
      }
    } catch (error) {
      console.warn('⚠️ Failed to mark message as read:', error.message);
    }
  }

  /**
   * Utility method to truncate large objects for logging
   * @param {any} obj - Object to truncate
   * @param {number} maxLength - Maximum string length
   * @returns {any} Truncated object
   */
  truncateForLogging(obj, maxLength = 500) {
    const str = JSON.stringify(obj, null, 2);
    if (str.length > maxLength) {
      return JSON.parse(str.substring(0, maxLength) + '"}');
    }
    return obj;
  }

  /**
   * Log errors with context
   * @param {string} operation - Operation that failed
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(operation, error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      operation,
      error: {
        name: error.name || 'Error',
        message: error.message,
        stack: error.stack
      },
      context
    };
    
    this.errorLog.push(errorLog);
    
    // Keep error log size manageable (reduced from 100 to 25)
    if (this.errorLog.length > 25) {
      this.errorLog = this.errorLog.slice(-25);
    }
    
    console.error('📝 Error logged:', errorLog);
  }

  /**
   * Update performance metrics
   * @param {number} processingTime - Processing time in milliseconds
   */
  updatePerformanceMetrics(processingTime) {
    this.processingTimes.push(processingTime);
    
    // Keep only last 50 processing times to prevent memory growth
    if (this.processingTimes.length > 50) {
      this.processingTimes = this.processingTimes.slice(-50);
    }
    
    this.averageProcessingTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  /**
   * Get quick statistics
   * @returns {Object} Quick stats
   */
  getQuickStats() {
    return {
      messages: this.messageCount,
      statuses: this.statusCount,
      errors: this.errorCount,
      avgProcessingTime: Math.round(this.averageProcessingTime)
    };
  }

  /**
   * Log comprehensive processing statistics
   */
  logStatistics() {
    const uptime = Date.now() - this.startTime;
    const uptimeMinutes = Math.round(uptime / (1000 * 60));
    
    console.log('📊 ===== PROCESSING STATISTICS =====');
    console.log(`🕐 Uptime: ${uptimeMinutes} minutes`);
    console.log(`📨 Messages processed: ${this.messageCount}`);
    console.log(`📊 Status updates processed: ${this.statusCount}`);
    console.log(`❌ Errors encountered: ${this.errorCount}`);
    console.log(`⚡ Average processing time: ${Math.round(this.averageProcessingTime)}ms`);
    console.log(`📈 Success rate: ${((this.messageCount - this.errorCount) / Math.max(this.messageCount, 1) * 100).toFixed(1)}%`);
    console.log('=====================================');
  }

  /**
   * Enhanced health check
   * @returns {Object} Health check result
   */
  async healthCheck() {
    try {
      const whatsappHealth = whatsappService && typeof whatsappService.healthCheck === 'function' 
        ? await whatsappService.healthCheck() 
        : { status: 'unknown', message: 'WhatsApp service not available' };
      
      const conversationHealth = conversationManager && typeof conversationManager.getSessionStats === 'function'
        ? conversationManager.getSessionStats()
        : { status: 'unknown', message: 'Conversation manager not available' };
      
      const uptime = Date.now() - this.startTime;
      const errorRate = this.messageCount > 0 ? (this.errorCount / this.messageCount) : 0;
      
      return {
        status: errorRate < 0.1 ? 'healthy' : 'degraded',
        controller: 'WhatsAppController',
        timestamp: new Date().toISOString(),
        uptime: uptime,
        statistics: {
          messages: this.messageCount,
          statuses: this.statusCount,
          errors: this.errorCount,
          errorRate: errorRate,
          averageProcessingTime: this.averageProcessingTime
        },
        services: {
        whatsapp: whatsappHealth,
          conversations: conversationHealth
        },
        recentErrors: this.errorLog.slice(-5)
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
   * Get detailed statistics
   * @returns {Object} Detailed statistics
   */
  getDetailedStatistics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        seconds: Math.round(uptime / 1000),
        minutes: Math.round(uptime / (1000 * 60)),
        hours: Math.round(uptime / (1000 * 60 * 60))
      },
      counters: {
        messages: this.messageCount,
        statuses: this.statusCount,
        errors: this.errorCount
      },
      performance: {
        averageProcessingTime: this.averageProcessingTime,
        recentProcessingTimes: this.processingTimes.slice(-10),
        successRate: this.messageCount > 0 ? ((this.messageCount - this.errorCount) / this.messageCount) : 1
      },
      errors: {
        recent: this.errorLog.slice(-10),
        total: this.errorLog.length
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.messageCount = 0;
    this.statusCount = 0;
    this.errorCount = 0;
    this.processingTimes = [];
    this.averageProcessingTime = 0;
    this.errorLog = [];
    this.startTime = Date.now();
    console.log('🔄 Statistics reset');
  }

  /**
   * Clean expired sessions (if conversation manager is available)
   * @returns {number} Number of cleaned sessions
   */
  cleanExpiredSessions() {
    if (conversationManager && typeof conversationManager.cleanExpiredSessions === 'function') {
      return conversationManager.cleanExpiredSessions();
    }
    return 0;
  }

  /**
   * Process test message for debugging
   * @param {string} userPhone - User's phone number
   * @param {string} message - Test message
   * @returns {Object} Processing result
   */
  async processTestMessage(userPhone, message) {
    try {
      console.log('🧪 ===== PROCESSING TEST MESSAGE =====');
      console.log('Test details:', { userPhone, message });
      
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
        message: 'Test message processed successfully',
        messageId: mockMessage.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Handle webhook verification for setup
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  handleWebhookVerification(req, res) {
    console.log('🔐 ===== WEBHOOK VERIFICATION =====');
    console.log('Query params:', req.query);
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Verification details:', { mode, token: token ? 'Present' : 'Missing', challenge });
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verification successful');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      res.status(403).send('Verification failed');
    }
  }
}

// Export singleton instance
module.exports = new WhatsAppController();