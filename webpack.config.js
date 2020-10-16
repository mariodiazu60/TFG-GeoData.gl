var path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    index: "./src/index.js",
    webapp: "./src/webapp.js"
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "[name].bundle.js"
  }
};
