const {
    Box
} = require('@pown/blessed')

const EMPTY = Buffer.from('')

class Request extends Box {
    constructor(options) {
        options = {
            keys: true,
            mouse: true,
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                inverse: true
            },

            methodColors: {
                'GET': 'green',
                'POST': 'yellow',
                'HEAD': 'yellow',
                'PUT': 'blue',
                'PATCH': 'red',
                'DELETE': 'red'
            },

            ...options,

            tags: true
        }

        super(options)
    }

    display(request) {
        const {
            method,
            scheme,
            host,
            port,
            path,
            query,
            version = 'HTTP/1.1',
            headers = {},
            body = EMPTY
        } = request

        const methodColor = this.options.methodColors[method] || 'white'

        let addressBlock

        if ((scheme === 'http' && port === 80) || (scheme === 'https' && port === 443)) {
            addressBlock = `${host}`
        } else {
            addressBlock = `${host}:${port}`
        }

        const headersBlock = Object.entries(headers).map(([name, value]) => {
            if (!Array.isArray(value)) {
                value = [value]
            }

            return value.map((value) => {
                return `{magenta-fg}${name}:{/magenta-fg} ${value}`
            }).join('\n')
        }).join('\n')

        const bodyBlock = body.toString()

        this.setContent(`{${methodColor}-fg}${method}{/${methodColor}-fg} ${scheme}://${addressBlock}${path}${query ? '?' + query : ''} ${version}\n${headersBlock}\n\n${bodyBlock}`)
    }
}


module.exports = Request
