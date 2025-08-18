// Webhook Testing Tool - test/webhookTester.js
// Use this to test your webhook with simulated WhatsApp message data

const axios = require('axios');

class WebhookTester {
  constructor(webhookUrl = 'https://airlineapp-backend.onrender.com/webhook') {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Test webhook with simulated text message
   */
  async testTextMessage(messageText = "Mumbai to Delhi tomorrow") {
    const testPayload = {
      "object": "whatsapp_business_account",
      "entry": [
        {
          "id": "24506999538897470",
          "changes": [
            {
              "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                  "display_phone_number": "15551856102",
                  "phone_number_id": "647423475131735"
                },
                "contacts": [
                  {
                    "profile": {
                      "name": "Test User"
                    },
                    "wa_id": "19023078334"
                  }
                ],
                "messages": [
                  {
                    "from": "19023078334",
                    "id": "wamid.HBgLMTkwMjMwNzgzMzQVAgARGBIxQ0EyM0E3NUE3QjFEQ0MwMzEA",
                    "timestamp": Math.floor(Date.now() / 1000).toString(),
                    "text": {
                      "body": messageText
                    },
                    "type": "text"
                  }
                ]
              },
              "field": "messages"
            }
          ]
        }
      ]
    };

    console.log('🧪 Testing webhook with text message:', messageText);
    console.log('📤 Sending payload to:', this.webhookUrl);

    try {
      const response = await axios.post(this.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'facebookexternalua'
        },
        timeout: 10000
      });

      console.log('✅ Webhook test successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Webhook test failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Test webhook with status update (like your current logs)
   */
  async testStatusUpdate() {
    const statusPayload = {
      "object": "whatsapp_business_account",
      "entry": [
        {
          "id": "24506999538897470",
          "changes": [
            {
              "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                  "display_phone_number": "15551856102",
                  "phone_number_id": "647423475131735"
                },
                "statuses": [
                  {
                    "id": "wamid.HBgLMTkwMjMwNzgzMzQVAgARGBI3QzJDODlFMjY1QTMwN0NENEYA",
                    "status": "read",
                    "timestamp": "1755471380",
                    "recipient_id": "19023078334"
                  }
                ]
              },
              "field": "messages"
            }
          ]
        }
      ]
    };

    console.log('🧪 Testing webhook with status update (like your current logs)');
    
    try {
      const response = await axios.post(this.webhookUrl, statusPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'facebookexternalua'
        }
      });

      console.log('✅ Status webhook test successful!');
      console.log('Response status:', response.status);
      return response;
    } catch (error) {
      console.error('❌ Status webhook test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test multiple flight search messages
   */
  async testFlightSearchMessages() {
    const testMessages = [
      "Mumbai to Delhi tomorrow",
      "Flight from BOM to DEL on 25th December for 2 passengers",
      "Need tickets from NYC to London on 2025-01-15",
      "Delhi to Mumbai",
      "BLR → DEL next Monday",
      "Going from Chennai to Kolkata on 25 Dec",
      "Book flight Mumbai to Singapore Jan 20th"
    ];

    console.log('🧪 Testing multiple flight search messages...');

    for (let i = 0; i < testMessages.length; i++) {
      console.log(`\n--- Test ${i + 1}/${testMessages.length} ---`);
      try {
        await this.testTextMessage(testMessages[i]);
        // Wait between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Test ${i + 1} failed:`, error.message);
      }
    }
  }

  /**
   * Test webhook verification (GET request)
   */
  async testWebhookVerification(verifyToken = 'your_verify_token') {
    const verificationUrl = `${this.webhookUrl}?hub.mode=subscribe&hub.challenge=test_challenge_12345&hub.verify_token=${verifyToken}`;
    
    console.log('🔐 Testing webhook verification...');
    console.log('Verification URL:', verificationUrl);

    try {
      const response = await axios.get(verificationUrl);
      console.log('✅ Webhook verification successful!');
      console.log('Challenge response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Webhook verification failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Test webhook endpoint availability
   */
  async testWebhookAvailability() {
    console.log('🔍 Testing webhook endpoint availability...');
    
    try {
      const response = await axios.head(this.webhookUrl, { timeout: 5000 });
      console.log('✅ Webhook endpoint is accessible');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      return true;
    } catch (error) {
      console.error('❌ Webhook endpoint not accessible:', error.message);
      return false;
    }
  }

  /**
   * Run comprehensive webhook tests
   */
  async runAllTests(verifyToken) {
    console.log('🏁 Running comprehensive webhook tests...\n');

    const results = {
      availability: false,
      verification: false,
      textMessage: false,
      statusUpdate: false
    };

    try {
      // Test 1: Endpoint availability
      console.log('=== Test 1: Endpoint Availability ===');
      results.availability = await this.testWebhookAvailability();
      
      // Test 2: Webhook verification
      console.log('\n=== Test 2: Webhook Verification ===');
      try {
        await this.testWebhookVerification(verifyToken);
        results.verification = true;
      } catch (error) {
        console.error('Verification test failed');
      }

      // Test 3: Text message processing
      console.log('\n=== Test 3: Text Message Processing ===');
      try {
        await this.testTextMessage("Mumbai to Delhi tomorrow");
        results.textMessage = true;
      } catch (error) {
        console.error('Text message test failed');
      }

      // Test 4: Status update processing
      console.log('\n=== Test 4: Status Update Processing ===');
      try {
        await this.testStatusUpdate();
        results.statusUpdate = true;
      } catch (error) {
        console.error('Status update test failed');
      }

      // Summary
      console.log('\n=== Test Results Summary ===');
      console.log('Endpoint Availability:', results.availability ? '✅' : '❌');
      console.log('Webhook Verification:', results.verification ? '✅' : '❌');
      console.log('Text Message Processing:', results.textMessage ? '✅' : '❌');
      console.log('Status Update Processing:', results.statusUpdate ? '✅' : '❌');

      const passedTests = Object.values(results).filter(Boolean).length;
      console.log(`\nOverall: ${passedTests}/4 tests passed`);

      return results;
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      return results;
    }
  }
}

// Usage examples and CLI interface
if (require.main === module) {
  const tester = new WebhookTester();

  async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    switch (command) {
      case 'text':
        const message = args[1] || 'Mumbai to Delhi tomorrow';
        await tester.testTextMessage(message);
        break;
      
      case 'status':
        await tester.testStatusUpdate();
        break;
      
      case 'verify':
        const token = args[1] || 'your_verify_token';
        await tester.testWebhookVerification(token);
        break;
      
      case 'availability':
        await tester.testWebhookAvailability();
        break;
      
      case 'all':
        const verifyToken = args[1] || process.env.WEBHOOK_VERIFY_TOKEN || 'your_verify_token';
        await tester.runAllTests(verifyToken);
        break;
      
      case 'flights':
        await tester.testFlightSearchMessages();
        break;
      
      default:
        console.log(`
🧪 Webhook Testing Tool Usage:

Commands:
  node webhookTester.js text [message]     - Test with text message
  node webhookTester.js status             - Test with status update
  node webhookTester.js verify [token]     - Test webhook verification
  node webhookTester.js availability       - Test endpoint availability
  node webhookTester.js flights            - Test multiple flight messages
  node webhookTester.js all [verify_token] - Run all tests

Examples:
  node webhookTester.js text "Mumbai to Delhi tomorrow"
  node webhookTester.js verify "your_webhook_verify_token"
  node webhookTester.js all "your_webhook_verify_token"

Environment Variables:
  WEBHOOK_VERIFY_TOKEN - Your webhook verification token
        `);
    }
  }

  main().catch(console.error);
}

module.exports = WebhookTester;