exports.handler = (argv, proxy) => {
    const ws = require('ws')
    const { Logger } = require('@pown/cli/lib/logger')

    const { unpackTransaction } = require('../pack')
    const { parseRequest, parseResponse } = require('../http')

    let id = 0

    const logger = new Logger(argv)

    const wsClient = new ws(argv['ws-client'], {})

    wsClient.on('open', () => {
        logger.warn(`connected to ${argv['ws-client']}`)
    })

    wsClient.on('message', (message) => {
        try {
            const { requestBuf, responseBuf } = unpackTransaction(message)

            const request = parseRequest(requestBuf)
            const response = parseResponse(responseBuf)

            proxy.emit('beep', { id: id++, ...request, ...response })
        } catch (e) {
            logger.error(e)
        }
    })
}
