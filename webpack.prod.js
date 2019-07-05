const path = require("path");

module.exports = {
  entry: {
    "tarumae-viewer": "./src/js/tarumae-viewer.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {}
        }
      },
      {
        test: /\.(frag|vert|shader)$/,
        use: {
          loader: 'raw-loader',
          options: {}
        }
      }
    ]
  },
  plugins: [ 
  ],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  }
};
