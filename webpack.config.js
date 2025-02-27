const webpack = require('webpack');

module.exports = {
    // 其他配置...
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                REACT_APP_GITHUB_ACCESS_TOKEN: JSON.stringify(process.env.REACT_APP_GITHUB_ACCESS_TOKEN)
            }
        })
    ]
};