const crypto = require('crypto');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'),"utf-8"));
module.exports = function createApiSig(params) {
    const paramString = Object.keys(params).sort().map(key => key + params[key]).join('');
    const hash = crypto.createHash('md5').update(paramString + config.secret_lastfm).digest('hex');
    return hash;
}