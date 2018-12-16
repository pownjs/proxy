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

class InterceptorStream extends Transform {
    constructor(id) {
        super({allowHalfOpen: true, readableObjectMode: true, writableObjectMode: true, readableHighWaterMark: Number.MAX_VALUE, writableHighWaterMark: Number.MAX_VALUE})

        this.id = id

        this.chunks = []
    }

    _transform(chunk, encoding, callback) {
        this.chunks.push(chunk)

        callback()
    }

    async _flush(callback) {
        const head = this.chunks[0]
        const body = await maybeDecompressBody(head.headers, Buffer.concat(this.chunks.slice(1)))

        this.chunks = undefined

        const self = this

        this.emit(`interception`, {
            id: this.id,

            head: head,
            body: body,

            post: async (event) => {
                const { data } = event

                const { head, body: _body } = data

                const body = await maybeCompressBody(head.headers, Buffer.from(_body))

                let transferMechanism = 'content-length'

                Object.entries(head.headers).forEach(([header, value]) => {
                    if (/^\s*transfer-encoding\s*$/i.test(header)) {
                        if (Array.isArray(value)) {
                            value = value[0]
                        }

                        transferMechanism = value.toLowerCase().trim()
                    } else
                    if (/^\s*content-length\s*$/i.test(header)) {
                        delete head.headers[header]
                    }
                })

                if (transferMechanism === 'content-length' && body.length) {
                    head.headers['content-length'] = body.length
                }

                self.push(head)
                self.push(body)

                callback()
            }
        })
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

        this.onObserveConnectHandler = this.onObserveConnectHandler.bind(this)
        this.onObserveRequestHandler = this.onObserveRequestHandler.bind(this)
        this.onObserveResponseHandler = this.onObserveResponseHandler.bind(this)

        this.onInterceptConnectHandler = this.onInterceptConnectHandler.bind(this)
        this.onInterceptRequestHandler = this.onInterceptRequestHandler.bind(this)
        this.onInterceptResponseHandle = this.onInterceptResponseHandler.bind(this)

        this.addListener('connect', this.onObserveConnectHandler)
        this.addListener('request', this.onObserveRequestHandler )
        this.addListener('response', this.onObserveResponseHandler)
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

        req.filter = 'pipeline'

        const { id, request, pipeline } = req

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

        res.filter = 'pipeline'

        const { id, response, pipeline } = res

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

    onInterceptConnectHandler(con) {
        con.filter = 'pipeline'
    }

    onInterceptRequestHandler(req) {
        if (!this.isRequestInScope(req)) {
            return
        }

        req.filter = 'pipeline'

        req.pipeline.first(new InterceptorStream(req.id).on('interception', this.emit.bind(this, `request-interception`)))
    }

    onInterceptResponseHandler(res) {
        if (!this.isResponseInScope(res)) {
            return
        }

        res.filter = 'pipeline'

        res.pipeline.first(new InterceptorStream(res.id).on('interception', this.emit.bind(this, `response-interception`)))
    }

    hookProxyInterceptor() {
        this.intercepting = true

        this.addListener('connect', this.onInterceptConnectHandler)
        this.addListener('request', this.onInterceptRequestHandler)
        this.addListener('response', this.onInterceptResponseHandle)
    }

    unhookProxyInterceptor() {
        this.intercepting = false

        this.removeListener('connect', this.onInterceptConnectHandler)
        this.removeListener('request', this.onInterceptRequestHandler)
        this.removeListener('response', this.onInterceptResponseHandler)
    }

    toggleInterception() {
        if (!this.intercepting) {
            this.hookProxyInterceptor()
        } else {
            this.unhookProxyInterceptor()
        }
    }
}

exports.Proxy = Proxy
