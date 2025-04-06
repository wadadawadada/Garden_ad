const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const originalHtml = fs.readFileSync('index.html', 'utf8');
const modifiedHtml = originalHtml
  .replace(/<script\s+type="module"\s+src="src\/preloader\.js"><\/script>\s*/g, '')
  .replace(/<script\s+type="module"\s+src="src\/main\.js"><\/script>\s*/g, '');

module.exports = {
  entry: ['./src/preloader.js', './src/main.js'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
  
      {
        test: /\.mp3$/,
        type: 'asset/inline'
      },
      {
        test: /\.(png|jpe?g|gif|svg|glb)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets',
              publicPath: '/assets'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: () => modifiedHtml,
      inject: 'body'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' }
      ]
    })
  ],
  mode: 'production'
};
