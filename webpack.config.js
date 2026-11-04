const webpack = require("@nativescript/webpack");

module.exports = (env) => {
  webpack.init(env);
  webpack.Utils.addCopyRule("**/*.gif");
  webpack.Utils.addCopyRule("**/*.svg");
  // Learn how to customize:
  // https://docs.nativescript.org/webpack
  // { "path": false }
  webpack.chainWebpack((config) => {
    config.module.rule("scss").use("postcss-loader").options({});
  });

  return webpack.resolveConfig();
};