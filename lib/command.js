exports.yargs = {
    command: 'proxy [options]',
    describe: 'HTTP proxy',

    builder: {
        host: {
            alias: 'h',
            type: 'string',
            default: '0.0.0.0',
            describe: 'Host to listen to'
        },

        port: {
            alias: 'p',
            type: 'number',
            default: 8080,
            describe: 'Port to listen to'
        },

        'ws': {
            alias: 's',
            type: 'boolean',
            default: false,
            describe: 'Forward on web socket'
        },
    
        'ws-host': {
            type: 'string',
            default: '0.0.0.0',
            describe: 'Web socket host'
        },

        'ws-port': {
            type: 'number',
            default: 9090,
            describe: 'Web socket port'
        },

        'ws-app': {
            type: 'string',
            alias: 'a',
            default: '',
            choices: ['', 'httpview'],
            describe: 'Open app'
        }
    },

    handler: (argv) => {
        const chalk = require('chalk')
        const nodeProxify = require('node-proxify')

        let ws
        let wsServer
        let buildRquest
        let buildResponse

        if (argv.ws) {
            ws = require('ws')

            wsServer = new ws.Server({host: argv['ws-host'], port: argv['ws-port']})

            wsServer.on('listening', () => {
                console.log(chalk.green('*'), `web socket listening on ${wsServer._server.address().address}:${wsServer._server.address().port}`)

                if (argv['ws-app']) {
                    const opn = require('opn')

                    switch (argv['ws-app']) {
                        case 'httpview':
                            opn(`https://httpview.secapps.com/#feedURI=${encodeURIComponent(`ws://${wsServer._server.address().address}:${wsServer._server.address().port}`)}`)

                            break

                        default:
                            console.error(chalk.red('-'), `unrecognized application ${argv['ws-app']}`)
                    }
                }
            })

            wsServer.on('connection', (client) => {
                console.log(chalk.green('*'), `web socket client connected from ${client._socket.remoteAddress}:${client._socket.remotePort}`)
            })

            const helpers = require('./helpers')

            buildRequest = helpers.buildRequest
            buildResponse = helpers.buildResponse
        }

        const proxy = nodeProxify.create_mitm_proxy().listen(argv.port)

        console.log(chalk.green('*'), `proxy listening on ${proxy.address().address}:${proxy.address().port}`)

        proxy.on('intercept-request', (port) => {
            if (!port.transaction) {
                port.transaction = {}
            }

            const { method, url: uri, httpVersion: version, headers } = port.req

            const chunks = []

            port.req.on('data', (data) => {
                chunks.push(data)
            })

            port.req.on('end', () => {
                const body = Buffer.concat(chunks)

                port.transaction.method = method
                port.transaction.uri = uri
                port.transaction.version = version
                port.transaction.headers = headers
                port.transaction.body = body
            })
        })

        proxy.on('intercept-response', (port) => {
            if (!port.transaction) {
                port.transaction = {}
            }

            const { statusCode: responseCode, statusMessage: responseMessage, httpVersion: responseVersion, headers: responseHeaders } = port.res

            const chunks = []

            port.res.on('data', (data) => {
                chunks.push(data)
            })

            port.res.on('end', () => {
                const responseBody = Buffer.concat(chunks)

                port.transaction.responseCode = responseCode
                port.transaction.responseMessage = responseMessage
                port.transaction.responseVersion = responseVersion
                port.transaction.responseHeaders = responseHeaders
                port.transaction.responseBody = responseBody

                proxy.emit('transaction', port.transaction)
            })
        })

        proxy.on('transaction', (transaction) => {
            console.log(chalk.green('-'), `${transaction.method} ${transaction.uri} ${transaction.responseCode} ${transaction.responseMessage}`)

            if (wsServer) {
                const requestBuf = buildRequest(transaction)
                const responseBuf = buildResponse(transaction)

                const headerBuf = Buffer.alloc(4 + 4)

                headerBuf.writeUInt32BE(3, 0)
                headerBuf.writeUInt32BE(requestBuf.byteLength, 4)

                const message = Buffer.concat([headerBuf, requestBuf, responseBuf])

                wsServer.clients.forEach((client) => {
                    if (client.readyState === ws.OPEN) {
                        client.send(message)
                    }
                })
            }
        })
    }
}
