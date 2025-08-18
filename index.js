// Enhanced Main Server File with Comprehensive Debugging and Monitoring
// index.js - Updated for comprehensive debugging and testing

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables first
require('dotenv').config();

// Enhanced startup logging
console.log('🚀 ===== AIRLINE WHATSAPP BOT STARTUP =====');
console.log(`📅 Startup Time: ${new Date().toISOString()}`);
console.log(`🌍 Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📦 Node Version: ${process.version}`);
console.log(`💻 Platform: ${process.platform} ${process.arch}`);
console.log(`🧠 Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);

/**
 * Enhanced environment validation with detailed reporting
 */
function validateEnvironment() {
  console.log('🔍 ===== ENVIRONMENT VALIDATION =====');
  
  const requiredVars = [
    { name: 'WHATSAPP_TOKEN', required: true, sensitive: true },
    { name: 'WHATSAPP_PHONE_NUMBER_ID', required: true, sensitive: false },
    { name: 'WHATSAPP_VERIFY_TOKEN', required: true, sensitive: true },
    { name: 'AMADEUS_CLIENT_ID', required: false, sensitive: true },
    { name: 'AMADEUS_CLIENT_SECRET', required: false, sensitive: true }
  ];
  
  const optionalVars = [
    'PORT',
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL',
    'LOG_LEVEL'
  ];
  
  const missing = [];
  const present = [];
  
  // Check required variables
  requiredVars.forEach(varInfo => {
    const value = process.env[varInfo.name];
    if (!value) {
      missing.push(varInfo.name);
      console.log(`❌ ${varInfo.name}: Missing`);
    } else {
      present.push(varInfo.name);
      if (varInfo.sensitive) {
        console.log(`✅ ${varInfo.name}: Set (${value.length} chars, hidden)`);
      } else {
        console.log(`✅ ${varInfo.name}: ${value}`);
      }
    }
  });
  
  // Check optional variables
  console.log('\n📋 Optional Environment Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`⚪ ${varName}: Not set (using default)`);
    }
  });
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:', missing);
    console.error('🔧 Please set these variables in your Render.com environment settings:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    
    // Don't exit in development, but warn
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Exiting due to missing configuration in production...');
      process.exit(1);
    } else {
      console.warn('⚠️ Continuing in development mode despite missing variables');
    }
  } else {
    console.log(`✅ All required environment variables are set (${present.length}/${requiredVars.length})`);
  }
  
  console.log('='.repeat(50));
}

// Validate environment before starting
validateEnvironment();

// Initialize app with enhanced configuration
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced error handling with detailed logging
process.on('uncaughtException', (error) => {
  console.error('💥 ===== UNCAUGHT EXCEPTION =====');
  console.error('❌ Error:', error.message);
  console.error('📍 Stack:', error.stack);
  console.error('🕐 Time:', new Date().toISOString());
  console.error('💾 Memory:', process.memoryUsage());
  console.error('⏱️ Uptime:', Math.floor(process.uptime()));
  console.error('================================');
  
  // Give time for logging before exit
  setTimeout(() => {
    console.error('🚨 Process exiting due to uncaught exception...');
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 ===== UNHANDLED REJECTION =====');
  console.error('❌ Reason:', reason);
  console.error('📍 Promise:', promise);
  console.error('🕐 Time:', new Date().toISOString());
  console.error('💾 Memory:', process.memoryUsage());
  console.error('================================');
  
  // Give time for logging before exit
  setTimeout(() => {
    console.error('🚨 Process exiting due to unhandled rejection...');
    process.exit(1);
  }, 1000);
});

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
  hsts: NODE_ENV === 'production'
}));

// Enhanced rate limiting for production
if (NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn('🚨 Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        time: new Date().toISOString()
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
  });
  
  app.use('/webhook', limiter);
  console.log('🛡️ Rate limiting enabled for production');
}

// Trust proxy (important for Render.com behind proxy)
app.set('trust proxy', 1);

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://airlineapp-backend.onrender.com',
    'https://graph.facebook.com',
    'https://*.facebook.com',
    'https://www.facebook.com',
    NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    NODE_ENV === 'development' ? 'http://localhost:8000' : null
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Hub-Signature-256', 'User-Agent'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
console.log('🌍 CORS configured with origins:', corsOptions.origin);

// Enhanced body parsing middleware with error handling
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb' 
}));

// Request logging middleware with detailed information
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    console.log('📨 ===== INCOMING REQUEST =====');
    console.log(`🕐 ${new Date().toISOString()}`);
    console.log(`📍 ${req.method} ${req.path}`);
    console.log(`🌍 IP: ${req.ip}`);
    console.log(`🖥️ User-Agent: ${req.get('User-Agent')}`);
    console.log(`📦 Content-Type: ${req.get('Content-Type')}`);
    console.log(`📏 Content-Length: ${req.get('Content-Length') || 'N/A'}`);
    
    if (req.method === 'POST' && req.body) {
      console.log(`📄 Body size: ${JSON.stringify(req.body).length} chars`);
    }
    
    // Log response details
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`✅ Response: ${res.statusCode} (${duration}ms)`);
    });
    
    next();
  });
}

// Import routes with enhanced error handling and fallbacks
let webhookRoutes, flightRoutes, whatsappController, messageParser;

console.log('🔥 ===== LOADING SERVICES AND ROUTES =====');

try {
  whatsappController = require('./controllers/whatsappController');
  console.log('✅ WhatsApp Controller loaded successfully');
} catch (error) {
  console.error('❌ Error loading WhatsApp Controller:', error.message);
  if (NODE_ENV === 'development') {
    console.error('📍 Stack:', error.stack);
  }
}

try {
  messageParser = require('./services/messageParser');
  console.log('✅ Message Parser loaded successfully');
} catch (error) {
  console.error('❌ Error loading Message Parser:', error.message);
  if (NODE_ENV === 'development') {
    console.error('📍 Stack:', error.stack);
  }
}

try {
  webhookRoutes = require('./routes/webhook');
  console.log('✅ Webhook routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading webhook routes:', error.message);
  if (NODE_ENV === 'development') {
    console.error('📍 Stack:', error.stack);
  }
}

try {
  flightRoutes = require('./routes/flights');
  console.log('✅ Flight routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading flight routes:', error.message);
  if (NODE_ENV === 'development') {
    console.error('📍 Stack:', error.stack);
  }
}

// Enhanced service health checks with detailed diagnostics
const performStartupChecks = async () => {
  console.log('🔍 ===== PERFORMING STARTUP HEALTH CHECKS =====');
  
  const checks = {
    whatsapp: { status: false, details: null },
    amadeus: { status: false, details: null },
    parser: { status: false, details: null },
    controller: { status: false, details: null },
    database: { status: false, details: null } // For future use
  };

  // Test WhatsApp service
  try {
    console.log('🔍 Testing WhatsApp service...');
    const whatsappService = require('./services/whatsappService');
    const healthCheck = await whatsappService.healthCheck();
    checks.whatsapp.status = healthCheck.status === 'healthy';
    checks.whatsapp.details = healthCheck;
    console.log(`${checks.whatsapp.status ? '✅' : '❌'} WhatsApp service: ${checks.whatsapp.status ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    console.error('❌ WhatsApp service health check failed:', error.message);
    checks.whatsapp.details = { error: error.message };
  }

  // Test Amadeus service
  try {
    console.log('🔍 Testing Amadeus service...');
    const amadeusService = require('./services/amadeusService');
    await amadeusService.getAccessToken();
    checks.amadeus.status = true;
    checks.amadeus.details = { message: 'Access token retrieved successfully' };
    console.log('✅ Amadeus service: PASSED');
  } catch (error) {
    console.error('❌ Amadeus service health check failed:', error.message);
    checks.amadeus.details = { error: error.message };
  }

  // Test Message Parser
  try {
    console.log('🔍 Testing Message Parser...');
    if (messageParser) {
      const testResult = messageParser.parseFlightQuery('Mumbai to Delhi tomorrow');
      checks.parser.status = testResult && testResult.confidence !== undefined;
      checks.parser.details = {
        testParsed: !!testResult,
        confidence: testResult?.confidence,
        statistics: messageParser.getStatistics ? messageParser.getStatistics() : null
      };
      console.log(`${checks.parser.status ? '✅' : '❌'} Message Parser: ${checks.parser.status ? 'PASSED' : 'FAILED'}`);
    }
  } catch (error) {
    console.error('❌ Message Parser health check failed:', error.message);
    checks.parser.details = { error: error.message };
  }

  // Test WhatsApp Controller
  try {
    console.log('🔍 Testing WhatsApp Controller...');
    if (whatsappController) {
      const controllerHealth = await whatsappController.healthCheck();
      checks.controller.status = controllerHealth.status !== 'unhealthy';
      checks.controller.details = controllerHealth;
      console.log(`${checks.controller.status ? '✅' : '❌'} WhatsApp Controller: ${checks.controller.status ? 'PASSED' : 'FAILED'}`);
    }
  } catch (error) {
    console.error('❌ WhatsApp Controller health check failed:', error.message);
    checks.controller.details = { error: error.message };
  }

  console.log('='.repeat(50));
  return checks;
};

// Mount webhook routes with enhanced fallbacks
if (webhookRoutes) {
  app.use('/webhook', webhookRoutes);
  console.log('✅ Webhook routes mounted on /webhook');
} else {
  // Enhanced fallback webhook routes
  console.log('⚠️ Webhook routes not available, setting up fallbacks...');
  
  app.get('/webhook', (req, res) => {
    console.log('🔍 Webhook verification attempt:', req.query);
    
    if (whatsappController && whatsappController.handleWebhookVerification) {
      whatsappController.handleWebhookVerification(req, res);
    } else {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Fallback webhook verification successful');
        res.status(200).send(challenge);
      } else {
        console.log('❌ Fallback webhook verification failed');
        res.status(403).send('Verification failed');
      }
    }
  });
  
  app.post('/webhook', (req, res) => {
    console.log('📨 Webhook POST received (fallback handler)');
    
    if (whatsappController && whatsappController.handleIncomingMessage) {
      whatsappController.handleIncomingMessage(req, res);
    } else {
      console.error('❌ WhatsApp controller not available for webhook processing');
      res.status(503).json({
        error: 'Webhook service unavailable',
        message: 'Controller not loaded. Please check server logs.'
      });
    }
  });
}

// Mount flight routes with enhanced fallbacks
if (flightRoutes) {
  app.use('/flights', flightRoutes);
  console.log('✅ Flight routes mounted on /flights');
} else {
  // Enhanced fallback flight routes
  console.log('⚠️ Flight routes not available, setting up fallbacks...');
  
  app.get('/flights/search', (req, res) => {
    console.log('✈️ Flight search request (fallback):', req.query);
    res.status(503).json({
      error: 'Flight service unavailable',
      message: 'Flight routes not loaded. Please check server configuration.',
      timestamp: new Date().toISOString()
    });
  });
  
  app.all('/flights/*', (req, res) => {
    console.log('✈️ Flight route fallback:', req.path);
    res.status(503).json({
      error: 'Flight service unavailable',
      message: 'Flight routes not loaded. Please check server configuration.',
      availableEndpoints: [
        'GET /flights/search (when properly configured)'
      ]
    });
  });
}

// Enhanced root health check endpoint with comprehensive diagnostics
app.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Perform quick health checks
    const healthChecks = await performStartupChecks();
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'Server is running',
      message: 'Airline WhatsApp Bot API is active',
      version: '2.0.0', // Updated version
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + 'MB'
      },
      services: {
        webhook: !!webhookRoutes,
        flights: !!flightRoutes,
        parser: !!messageParser,
        controller: !!whatsappController
      },
      healthChecks: healthChecks,
      responseTime: responseTime + 'ms',
      availableEndpoints: [
        'GET /',
        'GET /health-full',
        'GET /test',
        'GET /test-parser',
        'GET /test-whatsapp',
        'GET|POST /webhook',
        'GET /flights/search',
        'GET /debug/stats',
        'POST /debug/test-message'
      ]
    };

    res.json(healthData);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'Error during health check',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive health check endpoint with full diagnostics
app.get('/health-full', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const healthChecks = await performStartupChecks();
    const responseTime = Date.now() - startTime;
    
    const health = {
      timestamp: new Date().toISOString(),
      status: 'running',
      environment: NODE_ENV,
      port: PORT,
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + 'MB',
        arrayBuffers: Math.round(process.memoryUsage().arrayBuffers / 1024 / 1024) + 'MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : 'N/A (Windows)'
      },
      environmentVariables: {
        NODE_ENV: NODE_ENV,
        PORT: PORT,
        WHATSAPP_TOKEN: !!process.env.WHATSAPP_TOKEN,
        WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        AMADEUS_CLIENT_ID: !!process.env.AMADEUS_CLIENT_ID,
        AMADEUS_CLIENT_SECRET: !!process.env.AMADEUS_CLIENT_SECRET
      },
      routes: {
        webhook_loaded: !!webhookRoutes,
        flights_loaded: !!flightRoutes
      },
      services: healthChecks,
      statistics: {
        controller: whatsappController && whatsappController.getDetailedStatistics ? 
          whatsappController.getDetailedStatistics() : null,
        parser: messageParser && messageParser.getStatistics ? 
          messageParser.getStatistics() : null
      },
      responseTime: responseTime + 'ms',
      testEndpoints: [
        `GET ${req.protocol}://${req.get('host')}/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test`,
        `GET ${req.protocol}://${req.get('host')}/health-full`,
        `GET ${req.protocol}://${req.get('host')}/test`,
        `GET ${req.protocol}://${req.get('host')}/test-parser`,
        `POST ${req.protocol}://${req.get('host')}/debug/test-message`
      ]
    };

    res.json(health);
  } catch (error) {
    console.error('❌ Full health check error:', error);
    res.status(500).json({
      status: 'Error during full health check',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working correctly! 🚀',
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    path: req.originalUrl,
    method: req.method,
    headers: {
      'content-type': req.get('Content-Type'),
      'user-agent': req.get('User-Agent'),
      'host': req.get('Host')
    },
    webhook_url: `${req.protocol}://${req.get('host')}/webhook`,
    environment: NODE_ENV,
    version: '2.0.0',
    uptime: Math.floor(process.uptime()) + ' seconds'
  });
});

// Message Parser testing endpoint
app.get('/test-parser', (req, res) => {
  try {
    if (!messageParser) {
      return res.status(503).json({
        error: 'Message Parser not available',
        message: 'Parser service not loaded'
      });
    }

    const testMessage = req.query.message || 'Mumbai to Delhi tomorrow';
    console.log('🧪 Testing parser with message:', testMessage);
    
    const parseResult = messageParser.parseFlightQuery(testMessage);
    const parserStats = messageParser.getStatistics ? messageParser.getStatistics() : {};
    
    res.json({
      message: 'Message Parser test completed',
      timestamp: new Date().toISOString(),
      input: testMessage,
      parseResult: parseResult,
      parserStatistics: parserStats,
      testStatus: parseResult.confidence > 0 ? 'PASS' : 'FAIL'
    });
    
  } catch (error) {
    console.error('❌ Parser test error:', error);
    res.status(500).json({
      message: 'Message Parser test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// WhatsApp API connectivity test
app.get('/test-whatsapp', async (req, res) => {
  try {
    if (!whatsappController) {
      return res.status(503).json({
        error: 'WhatsApp Controller not available',
        message: 'Controller service not loaded'
      });
    }

    const health = await whatsappController.healthCheck();
    
    res.json({
      message: 'WhatsApp API connectivity test',
      timestamp: new Date().toISOString(),
      health: health,
      controllerStats: whatsappController.getStatistics ? whatsappController.getStatistics() : null,
      test_status: health.status === 'healthy' ? 'PASS' : 'FAIL'
    });
    
  } catch (error) {
    console.error('❌ WhatsApp test error:', error);
    res.status(500).json({
      message: 'WhatsApp API connectivity test failed',
      timestamp: new Date().toISOString(),
      error: error.message,
      test_status: 'FAIL'
    });
  }
});

// Debug endpoints for development
if (NODE_ENV === 'development') {
  // Debug statistics endpoint
  app.get('/debug/stats', (req, res) => {
    const stats = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      controller: whatsappController && whatsappController.getDetailedStatistics ? 
        whatsappController.getDetailedStatistics() : null,
      parser: messageParser && messageParser.getStatistics ? 
        messageParser.getStatistics() : null
    };
    
    res.json(stats);
  });

  // Test message processing endpoint
  app.post('/debug/test-message', async (req, res) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['phone', 'message']
        });
      }

      if (whatsappController && whatsappController.processTestMessage) {
        const result = await whatsappController.processTestMessage(phone, message);
        res.json({
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          error: 'Test message processing not available',
          message: 'Controller or method not loaded'
        });
      }
    } catch (error) {
      console.error('❌ Test message error:', error);
      res.status(500).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Reset statistics endpoint
  app.post('/debug/reset-stats', (req, res) => {
    if (whatsappController && whatsappController.resetStatistics) {
      whatsappController.resetStatistics();
    }
    if (messageParser && messageParser.resetStatistics) {
      messageParser.resetStatistics();
    }
    
    res.json({
      message: 'Statistics reset completed',
      timestamp: new Date().toISOString()
    });
  });
}

// Favicon route to prevent 404s
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Global error handling middleware with enhanced logging
app.use((err, req, res, next) => {
  // Enhanced error logging with context
  console.error('💥 ===== SERVER ERROR =====');
  console.error('❌ Error:', err.message);
  console.error('📍 Stack:', err.stack);
  console.error('🌍 URL:', req.url);
  console.error('📍 Method:', req.method);
  console.error('🖥️ IP:', req.ip);
  console.error('🕐 Time:', new Date().toISOString());
  console.error('💤 User-Agent:', req.get('User-Agent'));
  console.error('📦 Body:', req.body);
  console.error('❓ Query:', req.query);
  console.error('📋 Headers:', req.headers);
  console.error('💾 Memory:', process.memoryUsage());
  console.error('============================');
  
  // Don't expose sensitive error details in production
  const errorResponse = {
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: Date.now().toString() // Simple request ID for tracking
  };

  if (NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
    errorResponse.details = {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
  } else {
    errorResponse.message = 'Something went wrong. Please try again later.';
  }

  res.status(err.status || 500).json(errorResponse);
});

// Enhanced 404 handler with helpful information
app.use('*', (req, res) => {
  console.log(`📍 404 - Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    message: 'The requested endpoint does not exist',
    suggestions: [
      'Check the URL spelling',
      'Verify the HTTP method',
      'Review available endpoints below'
    ],
    availableRoutes: [
      'GET /',
      'GET /health-full',
      'GET /test',
      'GET /test-parser',
      'GET /test-whatsapp',
      'GET|POST /webhook',
      'GET /flights/search'
    ],
    debugRoutes: NODE_ENV === 'development' ? [
      'GET /debug/stats',
      'POST /debug/test-message',
      'POST /debug/reset-stats'
    ] : [],
    timestamp: new Date().toISOString()
  });
});

/**
 * Format uptime in human readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Enhanced server startup with comprehensive monitoring
 */
const startServer = async () => {
  try {
    console.log('🔍 ===== PERFORMING FINAL STARTUP CHECKS =====');
    
    // Perform comprehensive startup checks
    const healthChecks = await performStartupChecks();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log('\n' + '🚀 ' + '='.repeat(78));
      console.log('🎉 AIRLINE WHATSAPP BOT SERVER STARTED SUCCESSFULLY');
      console.log('🚀 ' + '='.repeat(78));
      
      console.log(`\n📊 Server Information:`);
      console.log(`   ✅ Port: ${PORT}`);
      console.log(`   ✅ Environment: ${NODE_ENV}`);
      console.log(`   ✅ Node Version: ${process.version}`);
      console.log(`   ✅ Platform: ${process.platform} ${process.arch}`);
      console.log(`   ✅ Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
      console.log(`   ✅ PID: ${process.pid}`);
      
      console.log(`\n🌍 Server URLs:`);
      console.log(`   🏠 Main URL: https://airlineapp-backend.onrender.com`);
      console.log(`   📱 Webhook: https://airlineapp-backend.onrender.com/webhook`);
      console.log(`   ✈️ Flight Search: https://airlineapp-backend.onrender.com/flights/search`);
      console.log(`   📊 Health Check: https://airlineapp-backend.onrender.com/health-full`);
      console.log(`   🧪 Test Parser: https://airlineapp-backend.onrender.com/test-parser`);
      
      if (NODE_ENV === 'development') {
        console.log(`\n🔧 Debug URLs (Development Only):`);
        console.log(`   📈 Statistics: https://airlineapp-backend.onrender.com/debug/stats`);
        console.log(`   💬 Test Message: POST https://airlineapp-backend.onrender.com/debug/test-message`);
      }
      
      console.log(`\n📋 Service Status:`);
      console.log(`   WhatsApp: ${healthChecks.whatsapp.status ? '✅ Ready' : '❌ Failed'}`);
      console.log(`   Amadeus: ${healthChecks.amadeus.status ? '✅ Ready' : '❌ Failed'}`);
      console.log(`   Parser: ${healthChecks.parser.status ? '✅ Ready' : '❌ Failed'}`);
      console.log(`   Controller: ${healthChecks.controller.status ? '✅ Ready' : '❌ Failed'}`);
      console.log(`   Webhook Routes: ${webhookRoutes ? '✅ Loaded' : '❌ Failed'}`);
      console.log(`   Flight Routes: ${flightRoutes ? '✅ Loaded' : '❌ Failed'}`);
      
      console.log(`\n📚 Available Endpoints:`);
      console.log(`   GET  /                     (main health check)`);
      console.log(`   GET  /health-full          (detailed diagnostics)`);
      console.log(`   GET  /test                 (connectivity test)`);
      console.log(`   GET  /test-parser          (parser functionality)`);
      console.log(`   GET  /test-whatsapp        (WhatsApp service)`);
      console.log(`   GET  /webhook              (webhook verification)`);
      console.log(`   POST /webhook              (receive messages)`);
      console.log(`   GET  /flights/search       (flight search API)`);
      
      if (NODE_ENV === 'development') {
        console.log(`\n🔧 Debug Endpoints (Development):`);
        console.log(`   GET  /debug/stats          (runtime statistics)`);
        console.log(`   POST /debug/test-message   (test message processing)`);
        console.log(`   POST /debug/reset-stats    (reset all statistics)`);
      }
      
      // Display warnings for failed services
      const failedServices = [];
      if (!healthChecks.whatsapp.status) failedServices.push('WhatsApp');
      if (!healthChecks.amadeus.status) failedServices.push('Amadeus');
      if (!healthChecks.parser.status) failedServices.push('Parser');
      if (!healthChecks.controller.status) failedServices.push('Controller');
      
      if (failedServices.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        failedServices.forEach(service => {
          console.log(`   ⚠️  ${service} service not ready - check configuration`);
        });
      }
      
      // Display success message
      if (failedServices.length === 0) {
        console.log(`\n🎊 All systems operational! Bot is ready to receive messages.`);
      } else {
        console.log(`\n⚠️  Server started with ${failedServices.length} service(s) not ready.`);
      }
      
      console.log('\n🚀 ' + '='.repeat(78));
    });

    // Enhanced graceful shutdown with cleanup
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 ===== GRACEFUL SHUTDOWN (${signal}) =====`);
      console.log('🕐 Time:', new Date().toISOString());
      console.log('⏱️ Uptime:', formatUptime(process.uptime()));
      console.log('📊 Final stats:');
      
      // Log final statistics
      if (whatsappController && whatsappController.getStatistics) {
        console.log('   Controller:', whatsappController.getStatistics());
      }
      if (messageParser && messageParser.getStatistics) {
        console.log('   Parser:', messageParser.getStatistics());
      }

      console.log('🔄 Closing HTTP server...');
      server.close(() => {
        console.log('✅ HTTP server closed');

        // Close any database connections here if you add them later
        // await db.close();

        console.log('🧹 Cleanup completed');
        console.log('👋 Goodbye!');
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error('🚨 Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

    // Log memory usage periodically in development
    if (NODE_ENV === 'development') {
      setInterval(() => {
        const memory = process.memoryUsage();
        const memoryMB = Math.round(memory.rss / 1024 / 1024);
        if (memoryMB > 100) { // Only log if memory usage is significant
          console.log(`💾 Memory check: ${memoryMB}MB RSS, ${Math.round(memory.heapUsed / 1024 / 1024)}MB Heap`);
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    }

    return server;

  } catch (error) {
    console.error('💥 ===== STARTUP FAILED =====');
    console.error('❌ Failed to start server:', error.message);
    console.error('📍 Stack:', error.stack);
    console.error('🕐 Time:', new Date().toISOString());
    console.error('💾 Memory:', process.memoryUsage());
    console.error('============================');
    
    // Exit with error code
    process.exit(1);
  }
};

// Start the server
console.log('🎬 Initiating server startup sequence...');
startServer().catch(error => {
  console.error('💥 Startup sequence failed:', error);
  process.exit(1);
});

// Export app for testing purposes
module.exports = app;