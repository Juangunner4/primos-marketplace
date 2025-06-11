const webpack = require("webpack");
const path = require("path");

module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert/"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
        url: require.resolve("url/"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser.js"),
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "@solana/spl-token-metadata": path.resolve(__dirname, "empty.js"),
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser.js",
          Buffer: ["buffer", "Buffer"],
        })
      );

      // Exclude node_modules from source map parsing to
      // suppress warnings about missing TypeScript files in
      // third-party packages like @reown/appkit-ui.
      if (config.module && Array.isArray(config.module.rules)) {
        config.module.rules.forEach((rule) => {
          if (Array.isArray(rule.oneOf)) {
            rule.oneOf.forEach((oneOfRule) => {
              const uses = oneOfRule.use || [];
              const loaders = Array.isArray(uses) ? uses : [uses];
              loaders.forEach((loader) => {
                if (
                  loader.loader &&
                  loader.loader.includes("source-map-loader")
                ) {
                  oneOfRule.exclude = /node_modules/;
                }
              });
            });
          }
        });
      }
      config.ignoreWarnings = [
        (warning) =>
          warning.module &&
          warning.module.resource &&
          warning.module.resource.includes("node_modules"),
      ];
      return config;
    },
  },
};
