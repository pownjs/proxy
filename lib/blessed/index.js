exports.handler = async(argv, proxy) => {
    const url = require('url')
    const blessed = require('@pown/blessed/lib/blessed')
    const Quit = require('@pown/blessed/lib/auxiliary/quit')
    const Console = require('@pown/blessed/lib/auxiliary/console')
    const HTTPView = require('@pown/blessed/lib/auxiliary/httpview')

    const s = blessed.screen({ name: 'Proxy' })

    const q = new Quit()
    const c = new Console()
    const h = new HTTPView()

    q.bindKeys()
    c.bindKeys()
    c.hijackConsole()

    s.append(q)
    s.append(c)
    s.append(h)

    proxy.on('beep', (transaction) => {
        const { uri, responseHeaders, responseBody } = transaction

        const { protocol, host, port, pathname, query, search } = url.parse(uri)

        transaction = {
            ...transaction,

            scheme: protocol.slice(0, -1),
            host: host,
            port: port || protocol === 'https:' ? 443 : 80,
            path: pathname || '',
            query: query || (search || '').slice(1),
            responseType: (responseHeaders['content-type'] || '').split(';')[0].trim().toLowerCase(),
            responseLength: responseBody.length
        }

        h.addTransaction(transaction)
    })
}
