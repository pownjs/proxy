exports.handler = (argv, proxy) => {
    const ws = require('ws')
    const opn = require('opn')
    const { Logger } = require('@pown/cli/lib/logger')

    const logger = new Logger(argv)

    const wsServer = new ws.Server({
        host: argv['ws-host'],
        port: argv['ws-port']
    })

    wsServer.on('listening', () => {
        const websocketUri = `ws://${wsServer._server.address().address}:${wsServer._server.address().port}`

        logger.info(`web socket listening on ${wsServer._server.address().address}:${wsServer._server.address().port}`)
        logger.warn(`connect to ${websocketUri}`)

        if (argv['ws-app']) {
            const opn = require('opn')

            switch (argv['ws-app']) {
                case 'httpview':
                    opn(`https://httpview.secapps.com/#feedURI=${encodeURIComponent(websocketUri)}`)

                    break

                default:
                    logger.error(`unrecognized application ${argv['ws-app']}`)
            }
        }
    })

    wsServer.on('connection', (client) => {
        logger.info(`web socket client connected from ${client._socket.remoteAddress}:${client._socket.remotePort}`)
    })

    const { buildRequest, buildResponse } = require('../helpers')

    proxy.on('beep', (transaction) => {
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
    })
}
