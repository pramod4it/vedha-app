require('@testing-library/jest-dom');

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => children,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

window.electronAPI = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  platform: 'linux',
  setSubscriptionLevel: jest.fn().mockResolvedValue({ success: true }),
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
