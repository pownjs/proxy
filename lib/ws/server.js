exports.handler = async (argv, proxy) => {
    const ws = require('ws')
    const opn = require('opn')
    const { Logger } = require('@pown/cli/lib/logger')

    const { packTransaction } = require('../pack')
    const { buildRequest, buildResponse } = require('../http')

    const logger = new Logger(argv)

    const wsServer = new ws.Server({
        host: argv['ws-host'],
        port: argv['ws-port']
    })

    wsServer.on('listening', () => {
        const { address, port } = wsServer._server.address()

        const websocketUri = `ws://${address}:${port}`

        logger.info(`web socket listening on ${address}:${port}`)
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

    proxy.on('beep', (transaction) => {
        const requestBuf = buildRequest(transaction)
        const responseBuf = buildResponse(transaction)

        const message = packTransaction({requestBuf, responseBuf})

        wsServer.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
                client.send(message)
            }
        })
    })
}
