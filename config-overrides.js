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
  }),
  (config) => {
    // Ensure JSON files are processed
    config.module.rules.push({
      test: /\.json$/,
      type: 'javascript/auto',
      include: path.resolve(__dirname, 'src/assets'),
    });
    return config;
  }
);
