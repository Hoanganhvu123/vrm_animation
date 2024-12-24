module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // Rules cho Express
    'consistent-return': 'error',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Error prevention
    'no-undef': 'error',
    'no-unused-expressions': 'error',
  },
};