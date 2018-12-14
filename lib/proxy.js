const url = require('url')
const zlib = require('zlib')
const { Transform } = require('stream')
const EventsEmitter = require('events')
const { Proxy: NodeProxy } = require('node-proxify')
const { CertManagerFs } = require('node-proxify/lib/cert-manager-fs')
const { compress: brotliCompress, decompress: brotliDecompress} = require('wasm-brotli')

const defaults = require('./defaults')

const maybeCompressBody = async (headers, body) => {
    if (!headers.hasOwnProperty('content-encoding')) {
        return body
    }

    let contentEncoding = headers['content-encoding']

    if (Array.isArray(contentEncoding)) {
        contentEncoding = contentEncoding[0]
    }

    contentEncoding = contentEncoding.trim().toLowerCase()

    if (contentEncoding === 'gzip') {
        try {
            return zlib.gzipSync(body)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e)
            }
        }
    } else
    if (contentEncoding === 'deflate') {
        try {
            return zlib.deflateSync(body)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e)
            }
        }
    } else
    if (contentEncoding === 'br') {
        try {
            return Buffer.from(await brotliCompress(body))
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e)
            }
        }
    }

    return body
}

const maybeDecompressBody = async (headers, body) => {
    if (!headers.hasOwnProperty('content-encoding')) {
        return body
    }

    let contentEncoding = headers['content-encoding']

    if (Array.isArray(contentEncoding)) {
        contentEncoding = contentEncoding[0]
    }

    contentEncoding = contentEncoding.trim().toLowerCase()

    if (contentEncoding === 'gzip') {
        try {
            return zlib.gunzipSync(body)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e)
            }
        }
    } else
    if (contentEncoding === 'deflate') {
        try {
            return zlib.inflateSync(body)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e)
            }
        }
    } else
    if (contentEncoding === 'br') {
        try {
            return Buffer.from(await brotliDecompress(body))
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e)
            }
        }
    }

    return body
}

class TransactionsManager {
    constructor() {
        this.transactions = {}
    }

    remove(id) {
        const item = this.transactions[id]

        delete this.transactions[id]

        return item
    }

    has(id) {
        return this.transactions.hasOwnProperty(id)
    }

    get(id) {
        return this.transactions[id]
    }

    update(id, props) {
        this.transactions[id] = {...this.transactions[id], ...props}
    }
}

class IdManager {
    constructor() {
        this.id = 0
    }

    make() {
        return this.id++
    }
}

class Proxy extends NodeProxy {
    constructor({certsDir=defaults.certsDir, serverKeyLength=defaults.serverKeyLength, defaultCaCommonName=defaults.defaultCaCommonName}={}) {
        const idManager = new IdManager()
        const certManager = new CertManagerFs(certsDir)

        certManager.serverKeyLength = serverKeyLength
        certManager.defaultCaCommonName = defaultCaCommonName

        super({idManager, certManager})

        this.idManager = idManager
        this.certManager = certManager
        this.transactionsManager = new TransactionsManager()

        this.on('connect', this.onObserveConnectHandler.bind(this))
        this.on('request', this.onObserveRequestHandler.bind(this))
        this.on('response', this.onObserveResponseHandler.bind(this))
    }

    isRequestInScope(req) {
        return true
    }

    isResponseInScope(res) {
        return true
    }

    onObserveConnectHandler(con) {
        con.filter = 'pipeline'
    }
    
    onObserveRequestHandler(req) {
        if (!this.isRequestInScope(req)) {
            return
        }

        const { id, request, pipeline } = req

        req.filter = 'pipeline'

        const em = new EventsEmitter()

        const requestDataChunks = []

        em.once('data', () => {
            em.on('data', (data) => {
                requestDataChunks.push(data)
            })
        })

        const transform = new Transform({
            objectMode: true,

            transform(data, encoding, callback) {
                em.emit('data', data)

                callback(null, data)
            }
        })

        transform.on('finish', () => {
            this.transactionsManager.update(id, {request, requestDataChunks})
        })

        pipeline.last(transform)
    }

    onObserveResponseHandler(res) {
        if (!this.isResponseInScope(res)) {
            return
        }

        const { id, response, pipeline } = res

        res.filter = 'pipeline'

        delete response.headers['content-length']

        response.headers['transfer-encoding'] = 'chunked'

        const em = new EventsEmitter()

        const responseDataChunks = []

        em.once('data', () => {
            em.on('data', (data) => {
                responseDataChunks.push(data)
            })
        })

        const transform = new Transform({
            objectMode: true,

            transform(data, encoding, callback) {
                em.emit('data', data)

                callback(null, data)
            }
        })

        transform.on('finish', () => {
            this.transactionsManager.update(id, {response, responseDataChunks})
        })

        transform.on('finish', async () => {
            const transactionItem = this.transactionsManager.remove(id)

            const { request: _request={}, requestDataChunks=[], response: _response={}, responseDataChunks=[] } = transactionItem

            const uri = url.format(_request)

            const { method, httpVersion: _version, headers } = _request

            const version = `HTTP/${_version}`

            const body = await maybeDecompressBody(headers, Buffer.concat(requestDataChunks))

            const { httpVersion: _responseVersion, statusCode: responseCode, statusMessage: responseMessage, headers: responseHeaders } = _response

            const responseVersion = `HTTP/${_responseVersion}`

            const responseBody = await maybeDecompressBody(responseHeaders, Buffer.concat(responseDataChunks))

            this.emit('beep', { id, method, uri, version, headers, body, responseVersion, responseCode, responseMessage, responseHeaders, responseBody, source: this.proxyUri })
        })

        pipeline.last(transform)
    }
}

exports.Proxy = Proxy
