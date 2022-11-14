const { createVanillaExtractPlugin } = require("@vanilla-extract/next-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { TreatPlugin } = require("treat/webpack-plugin");

const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.(ts|tsx)?$/,
      include: [/node_modules\/@loke\/design-system/],
      use: {
        loader: "babel-loader",
        options: {
          presets: [
            "@babel/preset-env",
            "@babel/preset-typescript",
            "@babel/preset-react",
          ],
        },
      },
    });

    config.plugins.push(
      new MiniCssExtractPlugin({
        ignoreOrder: true,
      })
    );

    config.plugins.push(
      new TreatPlugin({
        outputLoaders: [MiniCssExtractPlugin.loader],
      })
    );

    return config;
  },
};

module.exports = withVanillaExtract(nextConfig);
