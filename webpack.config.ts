import path from "node:path";
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
module.exports = {
  resolve: {
    plugins: [
      new TsConfigPathsPlugin({
        configFile: './tsconfig.json',
        extensions: ['.js', '.ts'],
      }),
    ],
  },
};
