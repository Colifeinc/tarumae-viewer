const path = require("path");

module.exports = {
  entry: {
    tarumae: "./src/js/tarumae.js",
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
        test: /\.(png|jpg|gif|frag|vert)$/,
        use: {
          loader: 'file-loader',
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
