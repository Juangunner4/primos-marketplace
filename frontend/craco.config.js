const webpack = require("webpack");

module.exports = {
    webpack: {
        configure: (config) => {
            // 1) Tell Webpack how to polyfill core modules
            config.resolve.fallback = {
                ...config.resolve.fallback,
                crypto: require.resolve("crypto-browserify"),
                stream: require.resolve("stream-browserify"),
                util: require.resolve("util/"),
                assert: require.resolve("assert/"),
                buffer: require.resolve("buffer/"),
                // polyfill `process` itself
                process: require.resolve("process/browser"),
            };
            // also alias the exact specifier so imports of "process/browser" map correctly
            config.resolve.alias = {
                ...config.resolve.alias,
                "process/browser": require.resolve("process/browser"),
            };

            // 2) Provide `process` & `Buffer` globals in your bundle
            config.plugins.push(
                new webpack.ProvidePlugin({
                    process: "process/browser",
                    Buffer: ["buffer", "Buffer"],
                })
            );

            // 3) Disable the “fullySpecified” check on .js/.mjs so imports without extensions work
            //    (this addresses the “Add the extension to the request” error) :contentReference[oaicite:0]{index=0}
            config.module.rules.push({
                test: /\.m?js$/,
                resolve: { fullySpecified: false },
            });

            return config;
        },
    },
};
