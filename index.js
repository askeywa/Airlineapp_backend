// Main server file - index.js (Updated for Render.com deployment)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security middleware
const rateLimit = require('express-rate-limit'); // Rate limiting

// Load environment variables first
require('dotenv').config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Give time for logging before exit
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Give time for logging before exit
  setTimeout(() => process.exit(1), 1000);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for production
if (NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/webhook', limiter);
}

// Trust proxy (important for Render.com behind proxy)
app.set('trust proxy', 1);

// CORS configuration for your domain
const corsOptions = {
  origin: [
    'https://airlineapp-backend.onrender.com',
    'https://graph.facebook.com',
    'https://*.facebook.com',
    'https://www.facebook.com',
    NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Hub-Signature-256'],
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware for development
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Import routes with enhanced error handling
let webhookRoutes, flightRoutes;

try {
  webhookRoutes = require('./routes/webhook');
  console.log('✅ Webhook routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading webhook routes:', error.message);
  if (NODE_ENV === 'development') {
    console.error('Stack:', error.stack);
  }
}

try {
  flightRoutes = require('./routes/flights');
  console.log('✅ Flight routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading flight routes:', error.message);
  if (NODE_ENV === 'development') {
    console.error('Stack:', error.stack);
  }
}

// Service health check - Test services on startup
const performStartupChecks = async () => {
  const checks = {
    whatsapp: false,
    amadeus: false,
    database: false // if you add database later
  };

  // Test WhatsApp service
  try {
    const whatsappService = require('./services/whatsappService');
    const healthCheck = await whatsappService.healthCheck();
    checks.whatsapp = healthCheck.status === 'healthy';
    console.log('✅ WhatsApp service health check:', checks.whatsapp ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('❌ WhatsApp service health check failed:', error.message);
  }

  // Test Amadeus service
  try {
    const amadeusService = require('./services/amadeusService');
    // Try to get access token to verify credentials
    await amadeusService.getAccessToken();
    checks.amadeus = true;
    console.log('✅ Amadeus service health check: PASSED');
  } catch (error) {
    console.error('❌ Amadeus service health check failed:', error.message);
  }

  return checks;
};

// Mount webhook routes
if (webhookRoutes) {
  app.use('/webhook', webhookRoutes);
  console.log('✅ Webhook routes mounted on /webhook');
} else {
  // Fallback webhook route
  const webhookFallback = (req, res) => {
    console.error('❌ Webhook route not available');
    res.status(503).json({
      error: 'Webhook service unavailable',
      message: 'Please try again later'
    });
  };
  app.all('/webhook/*', webhookFallback);
}

// Mount flight routes
if (flightRoutes) {
  app.use('/flights', flightRoutes);
  console.log('✅ Flight routes mounted on /flights');
} else {
  // Fallback flight routes
  const flightFallback = (req, res) => {
    console.error('❌ Flight routes not available');
    res.status(503).json({
      error: 'Flight service unavailable',
      message: 'Please try again later'
    });
  };
  app.all('/flights/*', flightFallback);
}

// Root health check endpoint
app.get('/', async (req, res) => {
  const healthData = {
    status: 'Server is running',
    message: 'Airline WhatsApp Bot API is active',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(process.memoryUsage().external / 1024 / 1024) + 'MB'
    },
    services: {
      webhook: !!webhookRoutes,
      flights: !!flightRoutes
    },
    availableEndpoints: [
      'GET /',
      'GET /health-full',
      'GET /test',
      'GET|POST /webhook',
      'GET /flights/search'
    ]
  };

  res.json(healthData);
});

// Comprehensive health check endpoint
app.get('/health-full', async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'running',
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    },
    environmentVariables: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
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
    testEndpoints: [
      'GET https://airlineapp-backend.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test',
      'GET https://airlineapp-backend.onrender.com/health-full',
      'GET https://airlineapp-backend.onrender.com/test'
    ]
  };

  // Test WhatsApp service
  try {
    const whatsappService = require('./services/whatsappService');
    const whatsappHealth = await whatsappService.healthCheck();
    health.services = { whatsapp: whatsappHealth };
  } catch (error) {
    health.services = { whatsapp: { error: error.message } };
  }

  res.json(health);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working correctly!',
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    path: req.originalUrl,
    webhook_url: 'https://airlineapp-backend.onrender.com/webhook'
  });
});

// Favicon route to prevent 404s
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log error with more details
  console.error('❌ Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Don't expose sensitive error details in production
  const errorResponse = {
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  };

  if (NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
  } else {
    errorResponse.message = 'Something went wrong. Please try again later.';
  }

  res.status(err.status || 500).json(errorResponse);
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    message: 'The requested endpoint does not exist',
    availableRoutes: [
      'GET /',
      'GET /health-full',
      'GET /test',
      'GET|POST /webhook',
      'GET /flights/search'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced logging
const startServer = async () => {
  try {
    // Perform startup checks
    console.log('🔍 Performing startup health checks...');
    const healthChecks = await performStartupChecks();

    const server = app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Server URL: https://airlineapp-backend.onrender.com`);
      console.log(`📱 Webhook URL: https://airlineapp-backend.onrender.com/webhook`);
      console.log(`🔍 Flight Search: https://airlineapp-backend.onrender.com/flights/search`);
      console.log(`📊 Status Page: https://airlineapp-backend.onrender.com/health-full`);
      console.log(`🏥 Health Check: https://airlineapp-backend.onrender.com`);
      console.log(`💾 Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`⚡ Node.js: ${process.version}`);
      console.log('');
      console.log('📋 Service Status:');
      console.log(`   WhatsApp: ${healthChecks.whatsapp ? '✅ Ready' : '❌ Failed'}`);
      console.log(`   Amadeus: ${healthChecks.amadeus ? '✅ Ready' : '❌ Failed'}`);
      console.log(`   Webhook: ${webhookRoutes ? '✅ Loaded' : '❌ Failed'}`);
      console.log(`   Flights: ${flightRoutes ? '✅ Loaded' : '❌ Failed'}`);
      console.log('');
      console.log('🔗 Available Endpoints:');
      console.log('     GET  / (health check)');
      console.log('     GET  /health-full (detailed status)');
      console.log('     GET  /test (connectivity test)');
      console.log('     GET  /webhook (webhook verification)');
      console.log('     POST /webhook (receive messages)');
      console.log('     GET  /flights/search (flight search API)');
      console.log('🚀 ================================');

      // Log any warnings
      if (!healthChecks.whatsapp) {
        console.log('⚠️  WARNING: WhatsApp service not ready - check credentials');
      }
      if (!healthChecks.amadeus) {
        console.log('⚠️  WARNING: Amadeus service not ready - check credentials');
      }
    });

    // Enhanced graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`🛑 ${signal} received, shutting down gracefully...`);

      server.close(() => {
        console.log('🔌 HTTP server closed');

        // Close any database connections here if you add them later
        // await db.close();

        console.log('✅ Graceful shutdown completed');
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

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();