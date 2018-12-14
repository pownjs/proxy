const {
    Box
} = require('@pown/blessed')

const EMPTY = Buffer.from('')

class Response extends Box {
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

            codeColors: {
                '1xx': 'blue',
                '2xx': 'green',
                '3xx': 'yellow',
                '4xx': 'red',
                '5xx': 'red'
            },

            ...options,

            tags: true
        }

        super(options)
    }

    display(response) {
        const {
            responseCode,
            responseMessage,
            responseVersion = 'HTTP/1.1',
            responseHeaders = {},
            responseBody = EMPTY
        } = response

        const codeColor = this.options.codeColors[responseCode.toString().replace(/(\d).*/, '$1xx')] || 'white'

        const headersBlock = Object.entries(responseHeaders).map(([name, value]) => {
            if (!Array.isArray(value)) {
                value = [value]
            }

            return value.map((value) => {
                return `{green-fg}${name}:{/green-fg} ${value}`
            }).join('\n')
        }).join('\n')

        const bodyBlock = responseBody.toString()

        this.setContent(`{${codeColor}-fg}${responseCode}{/${codeColor}-fg} ${responseMessage} ${responseVersion}\n${headersBlock}\n\n${bodyBlock}`)
    }
}

module.exports = Response
