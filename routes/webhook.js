// Fixed Webhook routes - routes/webhook.js
const express = require('express');
const router = express.Router();

// Import controller with error handling
let WhatsAppController;
try {
  WhatsAppController = require('../controllers/whatsappController');
  console.log('✅ WhatsApp controller loaded');
} catch (error) {
  console.error('❌ Error loading WhatsApp controller:', error.message);
}

// Add logging middleware for all webhook requests
router.use((req, res, next) => {
  console.log(`🔍 Webhook ${req.method} request:`, {
    url: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString(),
    userAgent: req.get('user-agent'),
    headers: {
      'content-type': req.get('content-type'),
      'x-forwarded-for': req.get('x-forwarded-for'),
      'x-real-ip': req.get('x-real-ip'),
      'x-hub-signature-256': req.get('x-hub-signature-256') ? 'present' : 'missing'
    }
  });
  next();
});

// Webhook verification (GET) - Meta requires this for webhook setup
router.get('/', (req, res) => {
  try {
    console.log('🔍 Webhook GET verification starting...');
    console.log('🌐 Webhook URL: https://airlineapp-backend.onrender.com/webhook');
    
    // Log environment status
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERIFY_TOKEN_SET: !!process.env.WHATSAPP_VERIFY_TOKEN,
      VERIFY_TOKEN_VALUE: process.env.WHATSAPP_VERIFY_TOKEN ? 
        process.env.WHATSAPP_VERIFY_TOKEN.substring(0, 3) + '***' : 'NOT SET'
    });
    
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔑 Verification parameters:', { 
      mode: mode || 'MISSING',
      expectedToken: verifyToken || 'NOT SET',
      receivedToken: token || 'MISSING',
      challenge: challenge ? `${challenge.substring(0, 10)}...` : 'MISSING',
      allParams: Object.keys(req.query),
      fullUrl: `https://airlineapp-backend.onrender.com${req.originalUrl}`
    });

    // Check if required env variable exists
    if (!verifyToken) {
      console.error('❌ WHATSAPP_VERIFY_TOKEN not set in environment');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'WHATSAPP_VERIFY_TOKEN not configured',
        webhook_url: 'https://airlineapp-backend.onrender.com/webhook'
      });
    }

    // Check if all required parameters are present
    if (!mode || !token || !challenge) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({
        error: 'Missing required parameters',
        expected_params: ['hub.mode', 'hub.verify_token', 'hub.challenge'],
        received_params: Object.keys(req.query)
      });
    }

    // Check if mode and token are correct
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verification successful!');
      console.log(`✅ Webhook URL verified: https://airlineapp-backend.onrender.com/webhook`);
      console.log(`✅ Returning challenge: ${challenge}`);
      
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed - token mismatch');
      console.log(`Expected: mode=subscribe, token=${verifyToken}`);
      console.log(`Received: mode=${mode}, token=${token}`);
      
      return res.status(403).json({
        error: 'Verification failed',
        expected: { 'hub.mode': 'subscribe', 'hub.verify_token': verifyToken },
        received: { 'hub.mode': mode, 'hub.verify_token': token }
      });
    }
  } catch (error) {
    console.error('❌ Error in webhook verification:', error.message);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({
      error: 'Internal server error during verification',
      message: error.message,
      webhook_url: 'https://airlineapp-backend.onrender.com/webhook'
    });
  }
});

// Webhook endpoint to receive messages (POST)
router.post('/', async (req, res) => {
  try {
    console.log('📨 ===== INCOMING WEBHOOK POST =====');
    console.log('📨 Timestamp:', new Date().toISOString());
    console.log('📨 Webhook URL: https://airlineapp-backend.onrender.com/webhook');
    console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📨 =====================================');
    
    // Validate request body first
    if (!req.body) {
      console.log('⚠️ Empty request body received');
      return res.status(200).send('OK'); // Still return OK to Meta
    }
    
    // Process webhook with controller if available
    if (WhatsAppController && WhatsAppController.handleIncomingMessage) {
      try {
        console.log('🔄 Processing webhook with WhatsApp controller...');
        
        // Call the correct method name and pass req, res
        await WhatsAppController.handleIncomingMessage(req, res);
        
        console.log('✅ Webhook processed successfully by controller');
        // Don't send response here - let controller handle it
        
      } catch (processingError) {
        console.error('❌ Error processing webhook:', processingError.message);
        console.error('Stack trace:', processingError.stack);
        
        // Send error response
        if (!res.headersSent) {
          return res.status(200).send('OK'); // Still send OK to Meta to avoid retries
        }
      }
    } else {
      console.log('⚠️ WhatsApp controller not available');
      
      // Fallback processing - log the webhook data
      console.log('📋 Fallback: Logging webhook data only');
      if (req.body.entry && Array.isArray(req.body.entry)) {
        req.body.entry.forEach((entry, entryIndex) => {
          console.log(`Entry ${entryIndex}:`, JSON.stringify(entry, null, 2));
          
          if (entry.changes && Array.isArray(entry.changes)) {
            entry.changes.forEach((change, changeIndex) => {
              console.log(`Change ${changeIndex}:`, JSON.stringify(change, null, 2));
            });
          }
        });
      }
      
      return res.status(200).send('OK');
    }
    
  } catch (error) {
    console.error('❌ Critical error in webhook POST handler:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Always send OK to Meta to prevent retries
    if (!res.headersSent) {
      return res.status(200).send('OK');
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhook_url: 'https://airlineapp-backend.onrender.com/webhook',
    controller_loaded: !!WhatsAppController,
    methods_available: WhatsAppController ? Object.getOwnPropertyNames(Object.getPrototypeOf(WhatsAppController)) : []
  });
});

// Test webhook endpoint for debugging
router.post('/test', (req, res) => {
  console.log('🧪 Test webhook called');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  
  res.status(200).json({
    message: 'Test webhook received',
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;