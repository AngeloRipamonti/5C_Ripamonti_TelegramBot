const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), "utf-8"));
module.exports = function createApiSign(params) {
    const paramString = Object.keys(params).sort().map(key => key + params[key]).join('');
    const hash = crypto.createHash('md5').update(paramString + config.secret_lastfm).digest('hex');
    return hash;
}