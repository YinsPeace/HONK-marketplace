module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:react/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: ['react', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  env: {
    es2020: true,
  },
  rules: {
    'no-undef': 'off', // Turn off no-undef for BigInt
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': 'error'
  },
};