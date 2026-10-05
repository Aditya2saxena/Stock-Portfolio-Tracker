// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// React Router 7 exposes this subpath through package exports. Jest 27 (bundled
// with react-scripts 5) does not resolve that export condition, so provide the
// same browser implementation exclusively for the test environment.
jest.mock(
  'react-router/dom',
  () => require('react-router/dist/development/dom-export.js'),
  { virtual: true }
);
