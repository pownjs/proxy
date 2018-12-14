exports.handler = (argv, proxy) => {
    const url = require('url')
    const debounce = require('debounce')
    const { Transform } = require('stream')
    const { Logger } = require('@pown/cli/lib/logger')

    const Request = require('./request')
    const Response = require('./response')
    const Transactions = require('./transactions')

    const {
        screen,
        Question,
        Log
    } = require('@pown/blessed')

    const s = screen({
        title: 'Pown Proxy'
    })

    s.key(['q', 'C-c', 'C-x'], () => {
        const question = new Question({
            keys: true,
            top: 'center',
            left: 'center',
            width: '50%',
            height: 5,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'grey'
                }
            }
        })

        s.append(question)

        question.ask('Do you really want to quit?', (err, result) => {
            if (err) {
                return
            }

            if (result) {
                return process.exit(0)
            }

            s.remove(question)
            s.render()
        })
    })

    const render = debounce(() => {
        s.render()
    }, 1000)

    const transactions = new Transactions({
        top: 0,
        left: 0,
        width: '100%',
        height: '50%',
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'grey'
            },
            focus: {
                border: {
                    fg: 'white'
                }
            }
        }
    })

    const request = new Request({
        bottom: 0,
        left: 0,
        width: '50%',
        height: '50%',
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'grey'
            },
            focus: {
                border: {
                    fg: 'white'
                }
            }
        }
    })

    const response = new Response({
        bottom: 0,
        right: 0,
        width: '50%',
        height: '50%',
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'grey'
            },
            focus: {
                border: {
                    fg: 'white'
                }
            }
        }
    })

    const log = new Log({
        top: 'center',
        left: 'center',
        width: '100%',
        height: '50%',
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'grey'
            },
            focus: {
                border: {
                    fg: 'white'
                }
            }
        },
        hidden: true,
        tags: true,
        label: 'Log'
    })

    s.append(transactions)
    s.append(request)
    s.append(response)
    s.append(log)

    transactions.focus()

    const focusElements = [transactions, request, response]
    let focusIndex = 0

    s.key(['tab'], () => {
        if (++focusIndex > focusElements.length - 1) {
            focusIndex = 0
        }

        focusElements[focusIndex].focus()
    })

    s.render()

    transactions.on('select', (a) => {
        request.display(a)
        response.display(a)

        s.render()
    })

    Logger.prototype.verbose = (...args) => {
        log.add([].concat(args).join(''))

        render()
    }

    Logger.prototype.info = (...args) => {
        log.add(['{green-fg}*{/green-fg}', ' '].concat(args).join(''))

        render()
    }

    Logger.prototype.warn = (...args) => {
        log.add(['{yellow-fg}!{/yellow-fg}', ' '].concat(args).join(''))

        render()
    }

    Logger.prototype.error = (...args) => {
        log.add(['{red-fg}x{/red-fg}', ' '].concat(args).join(''))

        render()
    }

    s.key(['C-l'], () => {
        log.toggle()

        s.render()
    })

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

        transactions.addItem(transaction)

        render()
    })
}
