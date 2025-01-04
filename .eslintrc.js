module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:react/recommended'
  ],
  plugins: ['react'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  env: {
    es2020: true,
  },
  rules: {
    'no-undef': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
