// tests/text-encoder-polyfill.js

// This file should be loaded first via `setupFiles` in jest.config.js
// It prepares the global scope with all necessary Web APIs that might be missing in the Node.js test environment.
// The order here is critical. Dependencies must be globally available before the modules that depend on them are required.

// 1. TextEncoder/Decoder from 'util'
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 2. Web Streams from 'stream/web'
const { ReadableStream } = require('stream/web');
global.ReadableStream = ReadableStream;

// 3. Messaging from 'worker_threads'
const { MessageChannel, MessagePort } = require('worker_threads');
global.MessageChannel = MessageChannel;
global.MessagePort = MessagePort;

// 4. Finally, undici, which depends on the globals above.
const { Request, Response, Headers, fetch } = require('undici');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;
