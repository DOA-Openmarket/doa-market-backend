import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { IncomingMessage } from 'http';
import logger from './utils/logger';

const serviceName = 'api-gateway';
const serviceVersion = '1.0.0';

// Configure OTLP exporter
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {},
});

// Initialize the SDK
const sdk = new NodeSDK({
  serviceName,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable instrumentations that are not needed
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Enable HTTP instrumentation
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span, request) => {
          const incomingRequest = request as IncomingMessage;
          if (incomingRequest.headers) {
            span.setAttribute('http.client_ip', incomingRequest.headers['x-forwarded-for'] || incomingRequest.socket?.remoteAddress || 'unknown');
          }
        },
      },
      // Enable Express instrumentation
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
    }),
  ],
});

// Start the SDK
export async function startTracing() {
  try {
    await sdk.start();
    logger.info(`Tracing initialized for ${serviceName}`);
  } catch (error) {
    logger.error('Error initializing tracing', error as Error);
  }
}

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    logger.info('Tracing terminated');
  } catch (error) {
    logger.error('Error terminating tracing', error as Error);
  } finally {
    process.exit(0);
  }
});

export default sdk;
