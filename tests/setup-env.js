// tests/setup-env.js
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { Request, Response, Headers, fetch } = require('whatwg-fetch');

global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;
