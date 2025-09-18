module.exports = {
  extends: ['react-app', 'react-app/jest', 'plugin:react/recommended'],
  plugins: ['react'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  env: {
    es2020: true,
  },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-extend-native': 'off',
    'no-loop-func': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx']
      }
    }
  }
};
