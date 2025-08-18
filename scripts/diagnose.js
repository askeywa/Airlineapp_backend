// WhatsApp Bot Diagnostic Script - scripts/diagnose.js
// Run this to identify issues with your WhatsApp bot setup

const axios = require('axios');
const messageParser = require('../services/messageParser');

class WhatsAppDiagnostic {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL || 'https://airlineapp-backend.onrender.com/webhook';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
  }

  /**
   * Run comprehensive diagnostic
   */
  async runDiagnostic() {
    console.log('🔬 ===== WHATSAPP BOT DIAGNOSTIC =====\n');
    
    const results = {
      environment: await this.checkEnvironmentVariables(),
      webhook: await this.checkWebhookEndpoint(),
      whatsappApi: await this.checkWhatsAppAPIAccess(),
      messageParser: await this.testMessageParser(),
      recommendations: []
    };

    this.generateRecommendations(results);
    this.printSummary(results);
    
    return results;
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables() {
    console.log('🔍 Checking Environment Variables...');
    
    const checks = {
      WHATSAPP_ACCESS_TOKEN: {
        value: this.accessToken,
        required: true,
        valid: false,
        message: ''
      },
      WHATSAPP_PHONE_NUMBER_ID: {
        value: this.phoneNumberId,
        required: true,
        valid: false,
        message: ''
      },
      WEBHOOK_VERIFY_TOKEN: {
        value: this.verifyToken,
        required: true,
        valid: false,
        message: ''
      },
      WEBHOOK_URL: {
        value: this.webhookUrl,
        required: true,
        valid: false,
        message: ''
      }
    };

    // Check ACCESS_TOKEN
    if (this.accessToken) {
      if (this.accessToken.startsWith('EAA') && this.accessToken.length > 100) {
        checks.WHATSAPP_ACCESS_TOKEN.valid = true;
        checks.WHATSAPP_ACCESS_TOKEN.message = '✅ Format looks correct';
      } else {
        checks.WHATSAPP_ACCESS_TOKEN.message = '⚠️ Token format may be incorrect';
      }
    } else {
      checks.WHATSAPP_ACCESS_TOKEN.message = '❌ Missing or empty';
    }

    // Check PHONE_NUMBER_ID
    if (this.phoneNumberId) {
      if (/^\d+$/.test(this.phoneNumberId) && this.phoneNumberId.length > 10) {
        checks.WHATSAPP_PHONE_NUMBER_ID.valid = true;
        checks.WHATSAPP_PHONE_NUMBER_ID.message = '✅ Format looks correct';
      } else {
        checks.WHATSAPP_PHONE_NUMBER_ID.message = '⚠️ Should be numeric and 10+ digits';
      }
    } else {
      checks.WHATSAPP_PHONE_NUMBER_ID.message = '❌ Missing or empty';
    }

    // Check VERIFY_TOKEN
    if (this.verifyToken) {
      if (this.verifyToken.length >= 8) {
        checks.WEBHOOK_VERIFY_TOKEN.valid = true;
        checks.WEBHOOK_VERIFY_TOKEN.message = '✅ Present and adequate length';
      } else {
        checks.WEBHOOK_VERIFY_TOKEN.message = '⚠️ Should be at least 8 characters';
      }
    } else {
      checks.WEBHOOK_VERIFY_TOKEN.message = '❌ Missing or empty';
    }

    // Check WEBHOOK_URL
    if (this.webhookUrl) {
      if (this.webhookUrl.startsWith('https://')) {
        checks.WEBHOOK_URL.valid = true;
        checks.WEBHOOK_URL.message = '✅ HTTPS URL provided';
      } else {
        checks.WEBHOOK_URL.message = '⚠️ Should be HTTPS URL';
      }
    } else {
      checks.WEBHOOK_URL.message = '❌ Missing or empty';
    }

    // Print results
    for (const [key, check] of Object.entries(checks)) {
      const status = check.valid ? '✅' : (check.value ? '⚠️' : '❌');
      const maskedValue = key.includes('TOKEN') ? 
        (check.value ? `${check.value.substring(0, 10)}...` : 'Not set') : 
        (check.value || 'Not set');
      
      console.log(`${status} ${key}: ${maskedValue}`);
      console.log(`   ${check.message}\n`);
    }

    return checks;
  }

  /**
   * Check webhook endpoint
   */
  async checkWebhookEndpoint() {
    console.log('🔍 Checking Webhook Endpoint...');
    
    const results = {
      accessible: false,
      httpsValid: false,
      verificationWorks: false,
      responseTime: 0,
      error: null
    };

    try {
      // Test endpoint accessibility
      console.log('📡 Testing endpoint accessibility...');
      const startTime = Date.now();
      
      const response = await axios.head(this.webhookUrl, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 4xx as accessible
      });
      
      results.responseTime = Date.now() - startTime;
      results.accessible = true;
      results.httpsValid = this.webhookUrl.startsWith('https://');
      
      console.log(`✅ Endpoint accessible (${results.responseTime}ms)`);
      console.log(`${results.httpsValid ? '✅' : '❌'} HTTPS: ${results.httpsValid}`);

      // Test webhook verification
      if (this.verifyToken) {
        console.log('🔐 Testing webhook verification...');
        try {
          const verifyUrl = `${this.webhookUrl}?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=${this.verifyToken}`;
          const verifyResponse = await axios.get(verifyUrl, { timeout: 5000 });
          
          if (verifyResponse.data === 'test123') {
            results.verificationWorks = true;
            console.log('✅ Webhook verification working');
          } else {
            console.log('❌ Webhook verification failed - wrong challenge response');
          }
        } catch (verifyError) {
          console.log(`❌ Webhook verification failed: ${verifyError.message}`);
        }
      }

    } catch (error) {
      results.error = error.message;
      console.log(`❌ Endpoint not accessible: ${error.message}`);
    }

    return results;
  }

  /**
   * Check WhatsApp API access
   */
  async checkWhatsAppAPIAccess() {
    console.log('🔍 Checking WhatsApp API Access...');
    
    const results = {
      tokenValid: false,
      phoneNumberValid: false,
      canSendMessages: false,
      error: null
    };

    if (!this.accessToken || !this.phoneNumberId) {
      results.error = 'Missing access token or phone number ID';
      console.log('❌ Cannot test API - missing credentials');
      return results;
    }

    try {
      // Test phone number info
      console.log('📞 Testing phone number access...');
      const phoneResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          timeout: 10000
        }
      );

      results.tokenValid = true;
      results.phoneNumberValid = true;
      console.log('✅ Phone number accessible');
      console.log(`   Display Name: ${phoneResponse.data.display_phone_number}`);
      console.log(`   Status: ${phoneResponse.data.status || 'Unknown'}`);

      // Test message sending capability (without actually sending)
      console.log('📤 Testing message sending capability...');
      const testPayload = {
        messaging_product: "whatsapp",
        to: "1234567890", // Fake number for testing
        type: "text",
        text: { body: "Test message" }
      };

      try {
        await axios.post(
          `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
          testPayload,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );
      } catch (sendError) {
        if (sendError.response?.status === 400 && 
            sendError.response?.data?.error?.code === 131049) {
          // Expected error for fake number - means API access is working
          results.canSendMessages = true;
          console.log('✅ Message sending capability confirmed');
        } else {
          console.log(`⚠️ Unexpected API response: ${sendError.message}`);
        }
      }

    } catch (error) {
      results.error = error.message;
      console.log(`❌ API access failed: ${error.message}`);
      
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    return results;
  }

  /**
   * Test message parser
   */
  async testMessageParser() {
    console.log('🔍 Testing Message Parser...');
    
    const testCases = [
      { input: "Mumbai to Delhi tomorrow", expectedConfidence: 0.7 },
      { input: "Flight from BOM to DEL on 25th December", expectedConfidence: 0.8 },
      { input: "Need tickets NYC to London 2025-01-15", expectedConfidence: 0.7 },
      { input: "Hello, how are you?", expectedConfidence: 0.1 },
      { input: "Book flight", expectedConfidence: 0.2 }
    ];

    const results = {
      totalTests: testCases.length,
      passed: 0,
      failed: 0,
      details: []
    };

    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      console.log(`\n--- Test ${i + 1}: "${test.input}" ---`);
      
      try {
        const parseResult = messageParser.parseFlightQuery(test.input);
        const passed = parseResult.confidence >= test.expectedConfidence;
        
        if (passed) {
          results.passed++;
          console.log(`✅ PASSED - Confidence: ${parseResult.confidence.toFixed(2)}`);
        } else {
          results.failed++;
          console.log(`❌ FAILED - Expected: ${test.expectedConfidence}, Got: ${parseResult.confidence.toFixed(2)}`);
        }

        results.details.push({
          input: test.input,
          expected: test.expectedConfidence,
          actual: parseResult.confidence,
          result: parseResult,
          passed
        });

        if (parseResult.origin && parseResult.destination) {
          console.log(`   Origin: ${parseResult.origin}, Destination: ${parseResult.destination}`);
        }
        if (parseResult.departureDate) {
          console.log(`   Date: ${parseResult.departureDate}`);
        }
        if (parseResult.adults > 1) {
          console.log(`   Passengers: ${parseResult.adults}`);
        }

      } catch (error) {
        results.failed++;
        console.log(`❌ ERROR: ${error.message}`);
        results.details.push({
          input: test.input,
          error: error.message,
          passed: false
        });
      }
    }

    console.log(`\n📊 Parser Test Summary: ${results.passed}/${results.totalTests} passed`);
    return results;
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  generateRecommendations(results) {
    const recommendations = [];

    // Environment variable recommendations
    const envChecks = results.environment;
    if (!envChecks.WHATSAPP_ACCESS_TOKEN.valid) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Environment',
        issue: 'Invalid or missing WhatsApp Access Token',
        solution: 'Get a valid access token from Meta Developer Console → WhatsApp → API Setup'
      });
    }

    if (!envChecks.WHATSAPP_PHONE_NUMBER_ID.valid) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Environment',
        issue: 'Invalid or missing Phone Number ID',
        solution: 'Get the phone number ID from Meta Developer Console → WhatsApp → API Setup'
      });
    }

    // Webhook recommendations
    if (!results.webhook.accessible) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Webhook',
        issue: 'Webhook endpoint not accessible',
        solution: 'Ensure your server is running and accessible from the internet. Check firewall settings.'
      });
    }

    if (!results.webhook.httpsValid) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Webhook',
        issue: 'Webhook URL is not HTTPS',
        solution: 'WhatsApp requires HTTPS URLs. Use SSL certificate or service like ngrok for testing.'
      });
    }

    if (!results.webhook.verificationWorks) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Webhook',
        issue: 'Webhook verification not working',
        solution: 'Check that WEBHOOK_VERIFY_TOKEN matches the token configured in Meta Developer Console'
      });
    }

    // WhatsApp API recommendations
    if (!results.whatsappApi.tokenValid) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'WhatsApp API',
        issue: 'Access token is invalid or expired',
        solution: 'Generate a new access token from Meta Developer Console or check token permissions'
      });
    }

    if (!results.whatsappApi.phoneNumberValid) {
      recommendations.push({
        priority: 'HIGH',
        category: 'WhatsApp API',
        issue: 'Phone number not accessible',
        solution: 'Verify phone number is properly configured and connected in Meta Business Manager'
      });
    }

    // Message parser recommendations
    if (results.messageParser.passed < results.messageParser.totalTests * 0.8) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Message Parser',
        issue: 'Message parser accuracy below 80%',
        solution: 'Review and improve message parsing patterns. Add more test cases and city mappings.'
      });
    }

    // Additional recommendations based on your log analysis
    recommendations.push({
      priority: 'CRITICAL',
      category: 'WhatsApp Setup',
      issue: 'Only receiving status updates, no actual messages',
      solution: 'In Meta Developer Console → WhatsApp → Configuration, ensure webhook is subscribed to "messages" field, not just message_deliveries or message_reads'
    });

    recommendations.push({
      priority: 'HIGH',
      category: 'Testing',
      issue: 'Need to test with actual user messages',
      solution: 'Send messages TO your business WhatsApp number (not FROM it). Messages sent FROM business number to users only generate status updates.'
    });

    results.recommendations = recommendations;
  }

  /**
   * Print diagnostic summary
   */
  printSummary(results) {
    console.log('\n🎯 ===== DIAGNOSTIC SUMMARY =====\n');

    // Environment Status
    const envValid = Object.values(results.environment).every(check => check.valid);
    console.log(`🔧 Environment Variables: ${envValid ? '✅ All Valid' : '❌ Issues Found'}`);

    // Webhook Status
    const webhookHealthy = results.webhook.accessible && results.webhook.httpsValid && results.webhook.verificationWorks;
    console.log(`🌐 Webhook Endpoint: ${webhookHealthy ? '✅ Healthy' : '❌ Issues Found'}`);

    // API Status
    const apiHealthy = results.whatsappApi.tokenValid && results.whatsappApi.phoneNumberValid;
    console.log(`📱 WhatsApp API: ${apiHealthy ? '✅ Accessible' : '❌ Issues Found'}`);

    // Parser Status
    const parserHealthy = results.messageParser.passed >= results.messageParser.totalTests * 0.8;
    console.log(`🧠 Message Parser: ${parserHealthy ? '✅ Working Well' : '⚠️ Needs Improvement'}`);

    // Priority recommendations
    console.log('\n🚨 HIGH PRIORITY RECOMMENDATIONS:\n');
    
    const highPriorityItems = results.recommendations.filter(r => 
      r.priority === 'CRITICAL' || r.priority === 'HIGH'
    );

    if (highPriorityItems.length === 0) {
      console.log('✅ No critical issues found!');
    } else {
      highPriorityItems.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}\n`);
      });
    }

    // Next steps
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Fix all CRITICAL and HIGH priority issues above');
    console.log('2. Use the webhook testing tool: node scripts/webhookTester.js all');
    console.log('3. Send a test message TO your business WhatsApp number');
    console.log('4. Check logs for incoming message data (should see "messages" array)');
    console.log('5. If still only seeing status updates, verify Meta Console webhook subscription\n');

    // Quick test command
    console.log('🧪 QUICK TEST COMMANDS:\n');
    console.log('# Test webhook with simulated message:');
    console.log('node scripts/webhookTester.js text "Mumbai to Delhi tomorrow"\n');
    console.log('# Test webhook verification:');
    console.log(`node scripts/webhookTester.js verify "${this.verifyToken}"\n`);
    console.log('# Run all tests:');
    console.log(`node scripts/webhookTester.js all "${this.verifyToken}"\n`);
  }

  /**
   * Save diagnostic report to file
   */
  async saveDiagnosticReport(results, filename = 'diagnostic_report.json') {
    try {
      const fs = require('fs').promises;
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          environment_valid: Object.values(results.environment).every(check => check.valid),
          webhook_healthy: results.webhook.accessible && results.webhook.httpsValid && results.webhook.verificationWorks,
          api_accessible: results.whatsappApi.tokenValid && results.whatsappApi.phoneNumberValid,
          parser_accuracy: results.messageParser.passed / results.messageParser.totalTests
        },
        details: results,
        next_steps: results.recommendations
      };

      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Diagnostic report saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save diagnostic report:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  async function main() {
    const diagnostic = new WhatsAppDiagnostic();
    
    console.log('Starting WhatsApp Bot Diagnostic...\n');
    console.log('This will check:');
    console.log('• Environment variables');
    console.log('• Webhook endpoint');
    console.log('• WhatsApp API access');
    console.log('• Message parser functionality\n');

    try {
      const results = await diagnostic.runDiagnostic();
      
      // Save report if requested
      const args = process.argv.slice(2);
      if (args.includes('--save') || args.includes('-s')) {
        const reportName = args.find(arg => arg.endsWith('.json')) || 
                          `diagnostic_report_${new Date().toISOString().split('T')[0]}.json`;
        await diagnostic.saveDiagnosticReport(results, reportName);
      }

    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = WhatsAppDiagnostic;