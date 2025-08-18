// Comprehensive Test Suite for WhatsApp Airline Bot
// test/comprehensiveTestSuite.js

const messageParser = require('../services/messageParser');
const whatsappController = require('../controllers/whatsappController');

class ComprehensiveTestSuite {
  constructor() {
    this.testResults = {
      parser: {},
      controller: {},
      integration: {},
      performance: {},
      summary: {}
    };
    
    // Comprehensive test messages covering various scenarios
    this.testMessages = [
      // Basic patterns
      { message: "Mumbai to Delhi tomorrow", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.7' }},
      { message: "Flight from BOM to DEL on 25th December", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.7' }},
      { message: "Need tickets from NYC to London on 2025-01-15", expected: { origin: 'JFK', destination: 'LHR', confidence: '>0.7' }},
      
      // Complex patterns  
      { message: "I want to travel from Mumbai to Delhi tomorrow for 3 people", expected: { origin: 'BOM', destination: 'DEL', adults: 3, confidence: '>0.7' }},
      { message: "Can you help me find flights BOM DEL 15 January 2025", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.6' }},
      { message: "Round trip Mumbai to Bangkok on 15th Jan return 25th Jan", expected: { origin: 'BOM', destination: 'BKK', isRoundTrip: true, confidence: '>0.7' }},
      
      // Edge cases
      { message: "Hi, how are you?", expected: { confidence: '0', messageType: 'greeting' }},
      { message: "Book flight", expected: { confidence: '<0.3', messageType: 'help' }},
      { message: "Mumbai Delhi", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.5' }},
      { message: "Tomorrow flight", expected: { confidence: '<0.4' }},
      { message: "2 passengers Mumbai to Delhi", expected: { origin: 'BOM', destination: 'DEL', adults: 2, confidence: '>0.6' }},
      
      // Different date formats
      { message: "Mumbai to Delhi on 2025-01-15", expected: { origin: 'BOM', destination: 'DEL', departureDate: '2025-01-15', confidence: '>0.7' }},
      { message: "BOM to DEL 15/01/2025", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.6' }},
      { message: "Delhi to Mumbai January 15th", expected: { origin: 'DEL', destination: 'BOM', confidence: '>0.6' }},
      { message: "Chennai to Kolkata next Monday", expected: { origin: 'MAA', destination: 'CCU', confidence: '>0.6' }},
      
      // International routes
      { message: "Delhi to Dubai next Friday", expected: { origin: 'DEL', destination: 'DXB', confidence: '>0.7' }},
      { message: "Mumbai to Singapore on Jan 20th", expected: { origin: 'BOM', destination: 'SIN', confidence: '>0.7' }},
      { message: "Bangalore to London tomorrow", expected: { origin: 'BLR', destination: 'LHR', confidence: '>0.7' }},
      
      // Different ways to express the same request
      { message: "Fly from Mumbai to Delhi tomorrow", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.7' }},
      { message: "I need to go from Mumbai to Delhi tomorrow", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.7' }},
      { message: "Travel Mumbai Delhi tomorrow", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.7' }},
      { message: "Trip from Mumbai to Delhi tomorrow", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.7' }},
      
      // Arrow and special characters
      { message: "BLR → DEL next Monday", expected: { origin: 'BLR', destination: 'DEL', confidence: '>0.7' }},
      { message: "Mumbai->Delhi for 4 passengers", expected: { origin: 'BOM', destination: 'DEL', adults: 4, confidence: '>0.7' }},
      { message: "Going from Chennai to Kolkata 25 Dec", expected: { origin: 'MAA', destination: 'CCU', confidence: '>0.7' }},
      
      // Multi-word cities
      { message: "New York to Los Angeles tomorrow", expected: { origin: 'JFK', destination: 'LAX', confidence: '>0.7' }},
      { message: "Hong Kong to Kuala Lumpur next week", expected: { origin: 'HKG', destination: 'KUL', confidence: '>0.6' }},
      
      // Partial information
      { message: "Flight to Delhi", expected: { destination: 'DEL', confidence: '<0.5' }},
      { message: "From Mumbai", expected: { origin: 'BOM', confidence: '<0.4' }},
      
      // Return trips
      { message: "Round trip Delhi to Bangkok January 15 return January 25", expected: { origin: 'DEL', destination: 'BKK', isRoundTrip: true, confidence: '>0.7' }},
      { message: "Return ticket Mumbai to Singapore", expected: { origin: 'BOM', destination: 'SIN', isRoundTrip: true, confidence: '>0.6' }},
      
      // Colloquial expressions
      { message: "Need to fly to Delhi from Mumbai ASAP", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.6' }},
      { message: "Quick trip BOM DEL", expected: { origin: 'BOM', destination: 'DEL', confidence: '>0.6' }},
      
      // Error cases
      { message: "", expected: { confidence: '0' }},
      { message: "Random text with no meaning", expected: { confidence: '0' }},
      { message: "123456", expected: { confidence: '0' }}
    ];
    
    // Performance test data
    this.performanceMessages = [
      "Mumbai to Delhi tomorrow",
      "Flight from BOM to DEL on 25th December for 2 passengers",
      "Round trip Mumbai to Bangkok January 15 return January 25",
      "Need tickets from NYC to London on 2025-01-15",
      "Travel Delhi to Dubai next Monday for 4 passengers"
    ];
    
    this.startTime = Date.now();
    console.log('🧪 Comprehensive Test Suite initialized');
  }

  /**
   * Run all tests
   * @returns {Object} Complete test results
   */
  async runAllTests() {
    console.log('🚀 ===== RUNNING COMPREHENSIVE TEST SUITE =====');
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    
    try {
      // 1. Parser Tests
      console.log('\n📝 Running Parser Tests...');
      this.testResults.parser = await this.runParserTests();
      
      // 2. Controller Tests
      console.log('\n🎮 Running Controller Tests...');
      this.testResults.controller = await this.runControllerTests();
      
      // 3. Integration Tests
      console.log('\n🔗 Running Integration Tests...');
      this.testResults.integration = await this.runIntegrationTests();
      
      // 4. Performance Tests
      console.log('\n⚡ Running Performance Tests...');
      this.testResults.performance = await this.runPerformanceTests();
      
      // 5. Generate Summary
      this.testResults.summary = this.generateTestSummary();
      
      // Display results
      this.displayResults();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      return {
        error: error.message,
        partialResults: this.testResults
      };
    }
  }

  /**
   * Run comprehensive parser tests
   * @returns {Object} Parser test results
   */
  async runParserTests() {
    console.log('🔍 Testing message parser...');
    
    const results = {
      total: this.testMessages.length,
      passed: 0,
      failed: 0,
      details: [],
      statistics: {},
      confidenceDistribution: { high: 0, medium: 0, low: 0, none: 0 }
    };
    
    for (let i = 0; i < this.testMessages.length; i++) {
      const test = this.testMessages[i];
      const testStartTime = Date.now();
      
      try {
        console.log(`\n🧪 Test ${i + 1}/${this.testMessages.length}: "${test.message}"`);
        
        const parseResult = messageParser.parseFlightQuery(test.message);
        const testDuration = Date.now() - testStartTime;
        
        // Evaluate against expectations
        const evaluation = this.evaluateParseResult(parseResult, test.expected);
        
        const testResult = {
          id: i + 1,
          input: test.message,
          expected: test.expected,
          actual: {
            origin: parseResult.origin,
            destination: parseResult.destination,
            departureDate: parseResult.departureDate,
            adults: parseResult.adults,
            confidence: parseResult.confidence,
            messageType: parseResult.messageType,
            isRoundTrip: parseResult.isRoundTrip
          },
          evaluation: evaluation,
          passed: evaluation.passed,
          duration: testDuration,
          issues: evaluation.issues
        };
        
        results.details.push(testResult);
        
        if (evaluation.passed) {
          results.passed++;
          console.log(`✅ PASSED (${testDuration}ms)`);
        } else {
          results.failed++;
          console.log(`❌ FAILED (${testDuration}ms)`);
          console.log(`   Issues: ${evaluation.issues.join(', ')}`);
        }
        
        // Update confidence distribution
        if (parseResult.confidence >= 0.7) results.confidenceDistribution.high++;
        else if (parseResult.confidence >= 0.4) results.confidenceDistribution.medium++;
        else if (parseResult.confidence > 0) results.confidenceDistribution.low++;
        else results.confidenceDistribution.none++;
        
      } catch (error) {
        results.failed++;
        results.details.push({
          id: i + 1,
          input: test.message,
          error: error.message,
          passed: false,
          duration: Date.now() - testStartTime
        });
        console.log(`❌ ERROR: ${error.message}`);
      }
    }
    
    // Get parser statistics
    results.statistics = messageParser.getStatistics ? messageParser.getStatistics() : {};
    results.successRate = (results.passed / results.total * 100).toFixed(1);
    
    console.log(`\n📊 Parser Tests Summary: ${results.passed}/${results.total} passed (${results.successRate}%)`);
    
    return results;
  }

  /**
   * Run controller tests
   * @returns {Object} Controller test results
   */
  async runControllerTests() {
    console.log('🎮 Testing WhatsApp controller...');
    
    const results = {
      healthCheck: null,
      statisticsTest: null,
      errorHandling: null,
      mockMessageProcessing: null
    };
    
    try {
      // Test health check
      console.log('🏥 Testing health check...');
      if (whatsappController.healthCheck) {
        results.healthCheck = await whatsappController.healthCheck();
        console.log('✅ Health check completed');
      } else {
        console.log('⚠️ Health check method not available');
      }
      
      // Test statistics
      console.log('📊 Testing statistics...');
      if (whatsappController.getDetailedStatistics) {
        results.statisticsTest = whatsappController.getDetailedStatistics();
        console.log('✅ Statistics retrieved');
      } else if (whatsappController.getStatistics) {
        results.statisticsTest = whatsappController.getStatistics();
        console.log('✅ Basic statistics retrieved');
      } else {
        console.log('⚠️ Statistics methods not available');
      }
      
      // Test mock message processing
      console.log('📨 Testing mock message processing...');
      if (whatsappController.processTestMessage) {
        const testPhone = '+1234567890';
        const testMessage = 'Mumbai to Delhi tomorrow';
        results.mockMessageProcessing = await whatsappController.processTestMessage(testPhone, testMessage);
        console.log('✅ Mock message processing completed');
      } else {
        console.log('⚠️ Mock message processing not available');
      }
      
    } catch (error) {
      console.error('❌ Controller test error:', error);
      results.error = error.message;
    }
    
    return results;
  }

  /**
   * Run integration tests
   * @returns {Object} Integration test results
   */
  async runIntegrationTests() {
    console.log('🔗 Testing end-to-end integration...');
    
    const results = {
      webhookStructure: null,
      messageFlow: null,
      responseGeneration: null
    };
    
    try {
      // Test webhook structure validation
      console.log('🔍 Testing webhook structure validation...');
      const mockWebhookData = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test_entry_id',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: 'test_phone_id'
              },
              contacts: [{
                profile: { name: 'Test User' },
                wa_id: '1234567890'
              }],
              messages: [{
                from: '1234567890',
                id: 'test_message_id',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'text',
                text: { body: 'Mumbai to Delhi tomorrow' }
              }]
            }
          }]
        }]
      };
      
      if (whatsappController.validateWebhookStructure) {
        results.webhookStructure = {
          valid: whatsappController.validateWebhookStructure(mockWebhookData),
          mockData: 'provided'
        };
        console.log('✅ Webhook structure validation tested');
      } else {
        console.log('⚠️ Webhook validation method not available');
      }
      
      // Test message flow
      console.log('📨 Testing complete message flow...');
      const sampleMessages = [
        'Mumbai to Delhi tomorrow',
        'Flight from BOM to DEL on 25th December',
        'Hi, how are you?'
      ];
      
      results.messageFlow = [];
      for (const msg of sampleMessages) {
        try {
          const parseResult = messageParser.parseFlightQuery(msg);
          results.messageFlow.push({
            message: msg,
            parsed: parseResult,
            success: parseResult.confidence > 0
          });
        } catch (error) {
          results.messageFlow.push({
            message: msg,
            error: error.message,
            success: false
          });
        }
      }
      console.log('✅ Message flow testing completed');
      
    } catch (error) {
      console.error('❌ Integration test error:', error);
      results.error = error.message;
    }
    
    return results;
  }

  /**
   * Run performance tests
   * @returns {Object} Performance test results
   */
  async runPerformanceTests() {
    console.log('⚡ Testing performance...');
    
    const results = {
      parsing: {},
      memory: {},
      concurrency: {}
    };
    
    try {
      // Parser performance test
      console.log('🔍 Testing parser performance...');
      const iterations = 1000;
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      for (let i = 0; i < iterations; i++) {
        const testMessage = this.performanceMessages[i % this.performanceMessages.length];
        messageParser.parseFlightQuery(testMessage);
      }
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      
      results.parsing = {
        iterations,
        totalTime: endTime - startTime,
        averageTime: (endTime - startTime) / iterations,
        messagesPerSecond: Math.round(iterations / ((endTime - startTime) / 1000)),
        memoryDelta: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed
        }
      };
      
      console.log(`✅ Parser performance: ${results.parsing.averageTime.toFixed(2)}ms avg, ${results.parsing.messagesPerSecond} msg/sec`);
      
      // Memory usage test
      console.log('💾 Testing memory usage...');
      const memoryBefore = process.memoryUsage();
      
      // Process a batch of messages
      const batchSize = 100;
      for (let i = 0; i < batchSize; i++) {
        const testMessage = `Test message ${i} Mumbai to Delhi tomorrow`;
        messageParser.parseFlightQuery(testMessage);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = process.memoryUsage();
      
      results.memory = {
        before: memoryBefore,
        after: memoryAfter,
        delta: {
          rss: memoryAfter.rss - memoryBefore.rss,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed
        },
        batchSize
      };
      
      console.log(`✅ Memory test completed: ${Math.round(results.memory.delta.heapUsed / 1024 / 1024)}MB heap delta`);
      
      // Concurrency simulation
      console.log('🔀 Testing concurrency simulation...');
      const concurrentRequests = 10;
      const promises = [];
      
      const concurrencyStartTime = Date.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(new Promise((resolve) => {
          const startTime = Date.now();
          const result = messageParser.parseFlightQuery(`Concurrent test ${i} Mumbai to Delhi tomorrow`);
          const duration = Date.now() - startTime;
          resolve({ id: i, duration, confidence: result.confidence });
        }));
      }
      
      const concurrencyResults = await Promise.all(promises);
      const concurrencyEndTime = Date.now();
      
      results.concurrency = {
        requests: concurrentRequests,
        totalTime: concurrencyEndTime - concurrencyStartTime,
        results: concurrencyResults,
        averageTime: concurrencyResults.reduce((sum, r) => sum + r.duration, 0) / concurrentRequests,
        maxTime: Math.max(...concurrencyResults.map(r => r.duration)),
        minTime: Math.min(...concurrencyResults.map(r => r.duration))
      };
      
      console.log(`✅ Concurrency test: ${concurrentRequests} requests in ${results.concurrency.totalTime}ms`);
      
    } catch (error) {
      console.error('❌ Performance test error:', error);
      results.error = error.message;
    }
    
    return results;
  }

  /**
   * Evaluate parse result against expectations
   * @param {Object} actual - Actual parse result
   * @param {Object} expected - Expected values
   * @returns {Object} Evaluation result
   */
  evaluateParseResult(actual, expected) {
    const evaluation = {
      passed: true,
      issues: []
    };
    
    // Check each expected field
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (field === 'confidence') {
        if (!this.evaluateConfidence(actual.confidence, expectedValue)) {
          evaluation.passed = false;
          evaluation.issues.push(`Confidence: expected ${expectedValue}, got ${actual.confidence.toFixed(3)}`);
        }
      } else if (actual[field] !== expectedValue) {
        evaluation.passed = false;
        evaluation.issues.push(`${field}: expected ${expectedValue}, got ${actual[field]}`);
      }
    }
    
    return evaluation;
  }

  /**
   * Evaluate confidence score against expected range/value
   * @param {number} actualConfidence - Actual confidence score
   * @param {string} expectedRange - Expected range (e.g., '>0.7', '<0.3', '0')
   * @returns {boolean} True if confidence meets expectation
   */
  evaluateConfidence(actualConfidence, expectedRange) {
    if (expectedRange === '0') {
      return actualConfidence === 0;
    }
    
    if (expectedRange.startsWith('>')) {
      const threshold = parseFloat(expectedRange.substring(1));
      return actualConfidence > threshold;
    }
    
    if (expectedRange.startsWith('<')) {
      const threshold = parseFloat(expectedRange.substring(1));
      return actualConfidence < threshold;
    }
    
    // Exact match
    const expected = parseFloat(expectedRange);
    return Math.abs(actualConfidence - expected) < 0.01;
  }

  /**
   * Generate comprehensive test summary
   * @returns {Object} Test summary
   */
  generateTestSummary() {
    const totalTime = Date.now() - this.startTime;
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalDuration: totalTime,
      overallStatus: 'unknown',
      scores: {},
      recommendations: [],
      statistics: {}
    };
    
    // Calculate scores
    if (this.testResults.parser.total > 0) {
      summary.scores.parser = (this.testResults.parser.passed / this.testResults.parser.total * 100).toFixed(1);
    }
    
    // Determine overall status
    const parserScore = parseFloat(summary.scores.parser || 0);
    if (parserScore >= 85) {
      summary.overallStatus = 'excellent';
    } else if (parserScore >= 70) {
      summary.overallStatus = 'good';
    } else if (parserScore >= 50) {
      summary.overallStatus = 'fair';
    } else {
      summary.overallStatus = 'poor';
    }
    
    // Generate recommendations
    if (parserScore < 70) {
      summary.recommendations.push('Improve message parsing accuracy');
    }
    
    if (this.testResults.performance?.parsing?.averageTime > 10) {
      summary.recommendations.push('Optimize parsing performance');
    }
    
    if (this.testResults.performance?.memory?.delta?.heapUsed > 10 * 1024 * 1024) {
      summary.recommendations.push('Investigate memory usage');
    }
    
    // Compile statistics
    summary.statistics = {
      totalTests: this.testResults.parser.total || 0,
      passedTests: this.testResults.parser.passed || 0,
      failedTests: this.testResults.parser.failed || 0,
      averageParsingTime: this.testResults.performance?.parsing?.averageTime,
      memoryUsage: this.testResults.performance?.memory?.delta?.heapUsed
    };
    
    return summary;
  }

  /**
   * Display comprehensive test results
   */
  displayResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(80));
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log(`Status: ${this.getStatusEmoji(this.testResults.summary.overallStatus)} ${this.testResults.summary.overallStatus.toUpperCase()}`);
    console.log(`Duration: ${this.testResults.summary.totalDuration}ms`);
    console.log(`Parser Score: ${this.testResults.summary.scores.parser}%`);
    
    // Parser Results
    if (this.testResults.parser.total > 0) {
      console.log('\n📝 PARSER RESULTS');
      console.log(`Tests: ${this.testResults.parser.passed}/${this.testResults.parser.total} passed (${this.testResults.parser.successRate}%)`);
      console.log(`Confidence Distribution:`);
      console.log(`  High (≥0.7): ${this.testResults.parser.confidenceDistribution.high}`);
      console.log(`  Medium (0.4-0.7): ${this.testResults.parser.confidenceDistribution.medium}`);
      console.log(`  Low (>0-0.4): ${this.testResults.parser.confidenceDistribution.low}`);
      console.log(`  None (0): ${this.testResults.parser.confidenceDistribution.none}`);
    }
    
    // Performance Results
    if (this.testResults.performance.parsing) {
      console.log('\n⚡ PERFORMANCE RESULTS');
      console.log(`Parsing Speed: ${this.testResults.performance.parsing.averageTime.toFixed(2)}ms average`);
      console.log(`Throughput: ${this.testResults.performance.parsing.messagesPerSecond} messages/second`);
      console.log(`Memory Delta: ${Math.round(this.testResults.performance.memory.delta.heapUsed / 1024 / 1024)}MB`);
    }
    
    // Recommendations
    if (this.testResults.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      this.testResults.summary.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    // Failed tests (if any)
    const failedTests = this.testResults.parser.details?.filter(test => !test.passed) || [];
    if (failedTests.length > 0 && failedTests.length <= 5) {
      console.log('\n❌ FAILED TESTS (Sample)');
      failedTests.slice(0, 5).forEach((test, i) => {
        console.log(`${i + 1}. "${test.input}" - ${test.issues?.join(', ') || 'Unknown error'}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✨ Test suite completed!');
    console.log('='.repeat(80));
  }

  /**
   * Get status emoji
   * @param {string} status - Status string
   * @returns {string} Emoji
   */
  getStatusEmoji(status) {
    const emojis = {
      'excellent': '🏆',
      'good': '✅',
      'fair': '⚠️',
      'poor': '❌',
      'unknown': '❓'
    };
    return emojis[status] || '❓';
  }

  /**
   * Export test results to JSON
   * @param {string} filename - Output filename
   */
  exportResults(filename = 'test-results.json') {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const outputPath = path.join(process.cwd(), filename);
      fs.writeFileSync(outputPath, JSON.stringify(this.testResults, null, 2));
      console.log(`📄 Test results exported to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to export results:', error.message);
    }
  }

  /**
   * Run specific test category
   * @param {string} category - Test category ('parser', 'controller', 'integration', 'performance')
   * @returns {Object} Test results for category
   */
  async runSpecificTest(category) {
    console.log(`🎯 Running ${category} tests only...`);
    
    switch (category.toLowerCase()) {
      case 'parser':
        return await this.runParserTests();
      case 'controller':
        return await this.runControllerTests();
      case 'integration':
        return await this.runIntegrationTests();
      case 'performance':
        return await this.runPerformanceTests();
      default:
        throw new Error(`Unknown test category: ${category}`);
    }
  }

  /**
   * Quick smoke test
   * @returns {Object} Quick test results
   */
  async runSmokeTest() {
    console.log('💨 Running smoke test...');
    
    const smokeTests = [
      "Mumbai to Delhi tomorrow",
      "Flight search BOM DEL",
      "Hi there"
    ];
    
    const results = { passed: 0, total: smokeTests.length, issues: [] };
    
    for (const test of smokeTests) {
      try {
        const result = messageParser.parseFlightQuery(test);
        if (result) {
          results.passed++;
        } else {
          results.issues.push(`Failed to parse: ${test}`);
        }
      } catch (error) {
        results.issues.push(`Error parsing "${test}": ${error.message}`);
      }
    }
    
    console.log(`💨 Smoke test: ${results.passed}/${results.total} passed`);
    return results;
  }
}

// Export for use in other files
module.exports = ComprehensiveTestSuite;

// If running directly, execute tests
if (require.main === module) {
  (async () => {
    const testSuite = new ComprehensiveTestSuite();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--smoke')) {
      await testSuite.runSmokeTest();
    } else if (args.includes('--parser')) {
      await testSuite.runSpecificTest('parser');
    } else if (args.includes('--performance')) {
      await testSuite.runSpecificTest('performance');
    } else {
      const results = await testSuite.runAllTests();
      
      if (args.includes('--export')) {
        testSuite.exportResults();
      }
    }
  })().catch(console.error);
}