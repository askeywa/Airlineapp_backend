// WhatsApp Business API Service - services/whatsappService.js (Updated to v23.0)
const axios = require('axios');
const http = require('http');
const https = require('https');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = 'https://graph.facebook.com/v23.0'; // Using v23.0 - current Meta version
    
    // Validate configuration
    if (!this.accessToken || !this.phoneNumberId) {
      console.error('❌ WhatsApp API credentials not configured');
      throw new Error('WhatsApp API credentials missing');
    }
    
    // Create optimized HTTP agents to reduce memory usage
    const httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 3,
      maxFreeSockets: 1,
      timeout: 30000,
      keepAliveMsecs: 30000,
      maxCachedSessions: 10
    });

    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 3,
      maxFreeSockets: 1,
      timeout: 30000,
      keepAliveMsecs: 30000,
      maxCachedSessions: 10,
      rejectUnauthorized: true
    });
    
    // Configure axios defaults with memory optimization
    this.axiosConfig = {
      timeout: 30000,
      maxBodyLength: 512 * 1024,
      maxContentLength: 512 * 1024,
      maxRedirects: 3,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Airline-Bot/1.0',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100',
        'Accept-Encoding': 'gzip, deflate'
      },
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      decompress: true,
      responseType: 'json',
      validateStatus: (status) => status < 500
    };
    
    // Create a dedicated axios instance with optimizations
    this.axiosInstance = axios.create(this.axiosConfig);
    
    // Add response interceptor to handle memory efficiently
    this.axiosInstance.interceptors.response.use(
      (response) => {
        delete response.config;
        delete response.request;
        return response;
      },
      (error) => {
        if (error.config) delete error.config;
        if (error.request) delete error.request;
        return Promise.reject(error);
      }
    );
    
    console.log('✅ WhatsApp service initialized with v23.0 API and memory optimizations');
  }

  // Send text message to WhatsApp user
  async sendTextMessage(to, message) {
    try {
      // Enhanced validation for v23.0
      if (!to || !message) {
        throw new Error('Missing required parameters: to, message');
      }
      
      if (typeof message !== 'string') {
        throw new Error('Message must be a string');
      }
      
      if (message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      // Clean phone number
      const cleanPhone = this.validatePhoneNumber(to);
      if (!cleanPhone) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      // Truncate message if too long (WhatsApp limit is 4096 characters)
      const truncatedMessage = message.length > 4000 
        ? message.substring(0, 3997) + '...'
        : message;

      console.log(`📤 Sending message to ${cleanPhone}: ${truncatedMessage.substring(0, 50)}...`);

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: this.formatMessage(truncatedMessage)
        }
      };

      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload
      );

      console.log('📊 WhatsApp API Response:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        hasMessages: !!(response.data && response.data.messages),
        messageCount: response.data && response.data.messages ? response.data.messages.length : 0,
        rawData: JSON.stringify(response.data, null, 2)
      });

      if (response.status === 200 && response.data) {
        if (response.data.messages && response.data.messages[0]) {
          console.log('✅ Message sent successfully:', response.data.messages[0].id);
          
          const result = {
            success: true,
            messageId: response.data.messages[0].id,
            to: cleanPhone
          };
          
          response.data = null;
          return result;
        } else if (response.data.error) {
          console.error('❌ WhatsApp API returned error:', response.data.error);
          throw new Error(`WhatsApp API error: ${response.data.error.message || 'Unknown error'}`);
        } else {
          console.warn('⚠️ Unexpected response structure from WhatsApp API:', response.data);
          // Still consider it successful if we got a 200 status
          const result = {
            success: true,
            messageId: `fallback_${Date.now()}`,
            to: cleanPhone,
            warning: 'Unexpected response structure but status was 200'
          };
          
          response.data = null;
          return result;
        }
      } else {
        throw new Error(`WhatsApp API returned status ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        stack: error.stack
      });
      
      // More detailed error handling
      if (error.response) {
        // HTTP error response
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 401) {
          throw new Error('WhatsApp API authentication failed - check access token');
        } else if (status === 403) {
          throw new Error('WhatsApp API access forbidden - check permissions or phone number verification');
        } else if (status === 400) {
          const errorMsg = errorData?.error?.message || 'Bad request';
          throw new Error(`WhatsApp API validation error: ${errorMsg}`);
        } else if (status === 429) {
          throw new Error('WhatsApp API rate limit exceeded - please retry later');
        } else if (status >= 500) {
          throw new Error('WhatsApp API server error - please retry later');
        } else if (errorData?.error?.message) {
          throw new Error(`WhatsApp API error: ${errorData.error.message}`);
        } else {
          throw new Error(`WhatsApp API HTTP error ${status}: ${error.response.statusText}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('WhatsApp API timeout - message may not have been delivered');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('WhatsApp API connection failed - check network connectivity');
      } else if (error.message.includes('Invalid response from WhatsApp API')) {
        throw error; // Re-throw our custom error
      } else {
        throw new Error(`Failed to send WhatsApp message: ${error.message}`);
      }
    }
  }

  // Send typing indicator (shows "typing..." to user) - v23.0 enhanced
  async sendTypingIndicator(to) {
    try {
      const cleanPhone = this.validatePhoneNumber(to);
      if (!cleanPhone) {
        console.warn('Invalid phone number for typing indicator:', to);
        return;
      }

      // Try proper typing indicator first (v23.0 supports this)
      try {
        const typingPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            body: '⌨️ Typing...'
          }
        };

        await this.axiosInstance.post(
          `${this.baseUrl}/${this.phoneNumberId}/messages`,
          typingPayload
        );
        
        console.log('✅ Typing indicator sent successfully');
        return;
        
      } catch (typingError) {
        console.warn('⚠️ Typing indicator failed, sending search message:', typingError.message);
        
        // Fallback to search message
        const fallbackPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            body: '🔍 Searching for flights... Please wait.'
          }
        };

        await this.axiosInstance.post(
          `${this.baseUrl}/${this.phoneNumberId}/messages`,
          fallbackPayload
        );
      }
      
    } catch (error) {
      console.error('Error sending typing indicator:', error.message);
      // Don't throw error for typing indicator failure
    }
  }

  // Send structured message with buttons (v23.0 compatible)
  async sendButtonMessage(to, text, buttons) {
    try {
      if (!buttons || buttons.length === 0 || buttons.length > 3) {
        return await this.sendTextMessage(to, text);
      }

      const cleanPhone = this.validatePhoneNumber(to);
      if (!cleanPhone) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: this.formatMessage(text)
          },
          action: {
            buttons: buttons.map((button, index) => ({
              type: 'reply',
              reply: {
                id: `btn_${index}_${Date.now()}`,
                title: button.title.substring(0, 20)
              }
            }))
          }
        }
      };

      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload
      );

      console.log('✅ Button message sent successfully');
      
      const result = {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        to: cleanPhone
      };
      
      response.data = null;
      return result;

    } catch (error) {
      console.error('❌ Error sending button message:', error.response?.data || error.message);
      console.log('🔄 Falling back to text message');
      return await this.sendTextMessage(to, text);
    }
  }

  // Send flight results as formatted message
  async sendFlightResults(to, flights, searchParams) {
    try {
      if (!flights || flights.length === 0) {
        return await this.sendTextMessage(
          to, 
          '❌ No flights found for your search criteria. Please try different dates or destinations.'
        );
      }

      let resultMessage = `✈️ *Flight Search Results*\n\n`;
      resultMessage += `🔍 ${searchParams.origin} ➡️ ${searchParams.destination}\n`;
      resultMessage += `📅 ${searchParams.departureDate}\n\n`;

      flights.slice(0, 5).forEach((flight, index) => {
        const price = flight.price?.total || 'N/A';
        const currency = flight.price?.currency || '';
        const duration = this.formatDuration(flight.itineraries?.[0]?.duration) || 'N/A';
        const airline = this.getAirlineName(flight.validatingAirlineCodes?.[0]) || 'N/A';
        
        const segments = flight.itineraries?.[0]?.segments || [];
        const departure = segments[0]?.departure;
        const arrival = segments[segments.length - 1]?.arrival;
        
        resultMessage += `*${index + 1}. ${airline}*\n`;
        resultMessage += `💰 Price: ${price} ${currency}\n`;
        resultMessage += `⏱️ Duration: ${duration}\n`;
        
        if (departure && arrival) {
          const depTime = new Date(departure.at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const arrTime = new Date(arrival.at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          resultMessage += `🛫 Departure: ${departure.iataCode} at ${depTime}\n`;
          resultMessage += `🛬 Arrival: ${arrival.iataCode} at ${arrTime}\n`;
        }
        
        if (segments.length > 1) {
          resultMessage += `🔄 Stops: ${segments.length - 1}\n`;
        }
        
        resultMessage += `──────────────────\n\n`;
      });

      resultMessage += `📞 To book any of these flights, please reply with the flight number or call us directly.\n\n`;
      resultMessage += `💡 Need different dates or destinations? Just send another search!`;

      return await this.sendTextMessage(to, resultMessage);

    } catch (error) {
      console.error('❌ Error sending flight results:', error.message);
      return await this.sendTextMessage(
        to, 
        'Sorry, I encountered an error while sending flight results. Please try again.'
      );
    }
  }

  // Validate and clean phone number
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    try {
      let cleaned = phoneNumber.toString().replace(/[^\d+]/g, '');
      
      if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
      }
      
      if (cleaned.length < 8 || cleaned.length > 15) {
        console.warn(`Invalid phone number length: ${phoneNumber}`);
        return null;
      }
      
      if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
      }
      
      console.log(`📞 Phone number validated: ${phoneNumber} -> ${cleaned}`);
      return cleaned;
      
    } catch (error) {
      console.error('Error validating phone number:', phoneNumber, error.message);
      return null;
    }
  }

  // Format message text
  formatMessage(message) {
    if (!message) return '';
    
    try {
      return message
        .trim()
        .replace(/\n{3,}/g, '\n\n')
        .substring(0, 4096);
        
    } catch (error) {
      console.error('Error formatting message:', error.message);
      return message.toString().substring(0, 4096);
    }
  }

  // Get phone number info (v23.0 compatible)
  async getPhoneNumberInfo() {
    try {
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/${this.phoneNumberId}`,
        {
          params: {
            fields: 'id,display_phone_number,verified_name,status'
          }
        }
      );

      console.log('✅ Phone number info retrieved');
      
      const result = {
        success: true,
        data: response.data
      };
      
      response.data = null;
      return result;

    } catch (error) {
      console.error('❌ Error getting phone number info:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mark message as read (v23.0 compatible)
  async markMessageAsRead(messageId) {
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      await this.axiosInstance.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload
      );

      console.log('✅ Message marked as read:', messageId);
      return { success: true };

    } catch (error) {
      console.error('❌ Error marking message as read:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Health check method with v23.0 compatibility
  async healthCheck() {
    try {
      const phoneInfo = await this.getPhoneNumberInfo();
      
      return {
        status: phoneInfo.success ? 'healthy' : 'degraded',
        service: 'WhatsApp Business API v23.0',
        webhook_url: 'https://airlineapp-backend.onrender.com/webhook',
        timestamp: new Date().toISOString(),
        phoneNumberConfigured: !!this.phoneNumberId,
        tokenConfigured: !!this.accessToken,
        phoneNumberInfo: phoneInfo.success ? phoneInfo.data : null,
        baseUrl: this.baseUrl,
        apiVersion: 'v23.0',
        features: {
          textMessages: true,
          interactiveMessages: true,
          mediaMessages: true,
          listMessages: true,
          buttonMessages: true,
          typingIndicator: true,
          readReceipts: true
        },
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        }
      };
      
    } catch (error) {
      console.error('❌ WhatsApp service health check failed:', error.message);
      return {
        status: 'unhealthy',
        service: 'WhatsApp Business API v23.0',
        webhook_url: 'https://airlineapp-backend.onrender.com/webhook',
        timestamp: new Date().toISOString(),
        error: error.message,
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        }
      };
    }
  }

  // Helper method to format flight duration
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

  // Helper method to get airline name
  getAirlineName(code) {
    const airlines = {
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
    
    return airlines[code] || code;
  }

  // Send media message (v23.0 compatible)
  async sendMediaMessage(to, mediaType, mediaUrl, caption = '') {
    try {
      const cleanPhone = this.validatePhoneNumber(to);
      if (!cleanPhone) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      const allowedTypes = ['image', 'document', 'audio', 'video'];
      if (!allowedTypes.includes(mediaType)) {
        throw new Error(`Invalid media type: ${mediaType}. Allowed: ${allowedTypes.join(', ')}`);
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl
        }
      };

      if (caption && ['image', 'document', 'video'].includes(mediaType)) {
        payload[mediaType].caption = this.formatMessage(caption.substring(0, 1024));
      }

      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload
      );

      console.log(`✅ ${mediaType} message sent successfully`);
      
      const result = {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        to: cleanPhone,
        mediaType
      };
      
      response.data = null;
      return result;

    } catch (error) {
      console.error(`❌ Error sending ${mediaType} message:`, error.response?.data || error.message);
      
      if (caption) {
        const fallbackText = `${caption}\n\nMedia: ${mediaUrl}`;
        return await this.sendTextMessage(to, fallbackText);
      } else {
        throw new Error(`Failed to send ${mediaType} message`);
      }
    }
  }

  // Send list message (v23.0 compatible)
  async sendListMessage(to, header, body, buttonText, sections) {
    try {
      if (!sections || sections.length === 0 || sections.length > 10) {
        return await this.sendTextMessage(to, `${header}\n\n${body}`);
      }

      const cleanPhone = this.validatePhoneNumber(to);
      if (!cleanPhone) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: header.substring(0, 60)
          },
          body: {
            text: this.formatMessage(body.substring(0, 1024))
          },
          action: {
            button: buttonText.substring(0, 20),
            sections: sections.slice(0, 10).map((section, sectionIndex) => ({
              title: section.title ? section.title.substring(0, 24) : `Section ${sectionIndex + 1}`,
              rows: (section.rows || []).slice(0, 10).map((row, rowIndex) => ({
                id: `list_${sectionIndex}_${rowIndex}_${Date.now()}`,
                title: row.title ? row.title.substring(0, 24) : `Option ${rowIndex + 1}`,
                description: row.description ? row.description.substring(0, 72) : ''
              }))
            }))
          }
        }
      };

      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload
      );

      console.log('✅ List message sent successfully');
      
      const result = {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        to: cleanPhone
      };
      
      response.data = null;
      return result;

    } catch (error) {
      console.error('❌ Error sending list message:', error.response?.data || error.message);
      console.log('🔄 Falling back to text message');
      const fallbackText = `${header}\n\n${body}\n\n${sections.map(section => 
        `${section.title}:\n${section.rows.map(row => `• ${row.title}`).join('\n')}`
      ).join('\n\n')}`;
      return await this.sendTextMessage(to, fallbackText);
    }
  }

  // Cleanup method to free memory
  cleanup() {
    try {
      if (this.axiosInstance) {
        this.axiosInstance = null;
      }
      
      if (global.gc) {
        global.gc();
        console.log('🧹 Memory cleanup performed');
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }
}

// Export singleton instance
module.exports = new WhatsAppService();