const { override, addBabelPlugins, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  ...addBabelPlugins(
    ['@babel/plugin-syntax-bigint', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
  ),
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  })
);
