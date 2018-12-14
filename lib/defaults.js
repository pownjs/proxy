const os = require('os')
const path = require('path')

exports.certsDir = path.join(os.homedir(), '.pown', 'proxy', 'certs')
exports.serverKeyLength = 1024
exports.defaultCaCommonName = 'Pown.js Proxy'
