#!/usr/bin/env node

/**
 * Load Testing Script for DOA Market API
 *
 * This script uses Newman to run load tests on the DOA Market API.
 * It simulates multiple concurrent users making requests to the API.
 *
 * Usage:
 *   node load-test.js [options]
 *
 * Options:
 *   --iterations <n>     Number of iterations per user (default: 10)
 *   --concurrent <n>     Number of concurrent users (default: 10)
 *   --environment <env>  Environment to use: local or production (default: local)
 *   --delay <ms>         Delay between requests in ms (default: 100)
 *   --folder <name>      Run specific folder only (e.g., "Products", "Orders")
 */

const newman = require('newman');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  iterations: 10,
  concurrent: 10,
  environment: 'local',
  delay: 100,
  folder: null
};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];

  if (key === 'iterations' || key === 'concurrent' || key === 'delay') {
    options[key] = parseInt(value, 10);
  } else {
    options[key] = value;
  }
}

console.log('🚀 Starting Load Test');
console.log('📊 Configuration:', options);
console.log('');

// Determine environment file
const envFile = options.environment === 'production'
  ? 'DOA-Market-Production.postman_environment.json'
  : 'DOA-Market-Local.postman_environment.json';

// Check if files exist
const collectionPath = path.join(__dirname, 'DOA-Market-API.postman_collection.json');
const environmentPath = path.join(__dirname, envFile);

if (!fs.existsSync(collectionPath)) {
  console.error('❌ Collection file not found:', collectionPath);
  process.exit(1);
}

if (!fs.existsSync(environmentPath)) {
  console.error('❌ Environment file not found:', environmentPath);
  process.exit(1);
}

// Track results
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  errors: []
};

// Run load test with concurrent users
const startTime = Date.now();
let completedRuns = 0;

console.log(`🔄 Running ${options.concurrent} concurrent users with ${options.iterations} iterations each...`);
console.log('');

const runPromises = [];

for (let i = 0; i < options.concurrent; i++) {
  const runConfig = {
    collection: collectionPath,
    environment: environmentPath,
    iterationCount: options.iterations,
    delayRequest: options.delay,
    reporters: ['cli'],
    reporter: {
      cli: {
        silent: true,
        noSummary: false,
        noFailures: false,
        noAssertions: false
      }
    }
  };

  // Add folder filter if specified
  if (options.folder) {
    runConfig.folder = options.folder;
  }

  const runPromise = new Promise((resolve, reject) => {
    newman.run(runConfig, (err, summary) => {
      completedRuns++;

      if (err) {
        console.error(`❌ User ${i + 1} failed:`, err);
        reject(err);
        return;
      }

      // Aggregate stats
      if (summary.run && summary.run.executions) {
        summary.run.executions.forEach(execution => {
          results.totalRequests++;

          if (execution.response) {
            const responseTime = execution.response.responseTime;
            results.totalResponseTime += responseTime;
            results.minResponseTime = Math.min(results.minResponseTime, responseTime);
            results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);

            if (execution.response.code >= 200 && execution.response.code < 400) {
              results.successfulRequests++;
            } else {
              results.failedRequests++;
            }
          }

          // Track errors
          if (execution.requestError) {
            results.errors.push({
              request: execution.item.name,
              error: execution.requestError.message
            });
          }
        });
      }

      console.log(`✅ User ${i + 1} completed (${completedRuns}/${options.concurrent})`);
      resolve(summary);
    });
  });

  runPromises.push(runPromise);
}

// Wait for all runs to complete
Promise.all(runPromises)
  .then(() => {
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const avgResponseTime = results.totalResponseTime / results.totalRequests;
    const requestsPerSecond = results.totalRequests / totalDuration;

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('📈 Load Test Results');
    console.log('═══════════════════════════════════════════════');
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log(`📊 Total Requests: ${results.totalRequests}`);
    console.log(`✅ Successful: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`❌ Failed: ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(2)}%)`);
    console.log('');
    console.log('⚡ Performance Metrics:');
    console.log(`   Requests/sec: ${requestsPerSecond.toFixed(2)}`);
    console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min Response Time: ${results.minResponseTime}ms`);
    console.log(`   Max Response Time: ${results.maxResponseTime}ms`);

    if (results.errors.length > 0) {
      console.log('');
      console.log('⚠️  Errors:');
      results.errors.slice(0, 10).forEach(error => {
        console.log(`   ${error.request}: ${error.error}`);
      });
      if (results.errors.length > 10) {
        console.log(`   ... and ${results.errors.length - 10} more errors`);
      }
    }

    console.log('═══════════════════════════════════════════════');
    console.log('');

    // Exit with appropriate code
    if (results.failedRequests > results.successfulRequests * 0.1) {
      console.log('⚠️  Warning: High failure rate detected!');
      process.exit(1);
    } else {
      console.log('🎉 Load test completed successfully!');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('');
    console.error('❌ Load test failed:', err);
    process.exit(1);
  });
