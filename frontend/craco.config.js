// craco.config.js
const webpack = require("webpack");

module.exports = {
    webpack: {
        configure: (config) => {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                crypto: require.resolve("crypto-browserify"),
                stream: require.resolve("stream-browserify"),
                assert: require.resolve("assert/"),
                buffer: require.resolve("buffer/"),
                util: require.resolve("util/"),
                // polyfill `process` itself...
                process: require.resolve("process/browser"),
                // …and also handle explicit `import "process/browser"`
                "process/browser": require.resolve("process/browser"),
            };

            config.plugins.push(
                new webpack.ProvidePlugin({
                    process: "process/browser",
                    Buffer: ["buffer", "Buffer"],
                })
            );

            return config;
        },
    },
};
