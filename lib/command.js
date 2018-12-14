const os = require('os')
const path = require('path')

exports.yargs = {
    command: 'proxy [options]',
    describe: 'HTTP proxy',

    builder: {
        log: {
            alias: 'l',
            type: 'boolean',
            default: false,
            describe: 'Log requests and responses'
        },

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

        text: {
            alias: 't',
            type: 'boolean',
            default: false,
            describe: 'Start with text ui'
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
            default: '',
            choices: ['', 'httpview'],
            describe: 'Open app'
        },

        'certs-directory': {
            type: 'string',
            default: path.join(os.homedir(), '.pown', 'proxy', 'certs'),
            describe: 'Directory for the certificates'
        },

        'server-key-length': {
            type: 'number',
            default: 1024,
            describe: 'Default key length for certificates'
        },

        'default-ca-common-name': {
            type: 'string',
            default: 'Pown.js Proxy',
            describe: 'The CA common name'
        }
    },

    handler: (argv) => {
        const mkdirp = require('mkdirp')
        const { Logger } = require('@pown/cli/lib/logger')    

        const logger = new Logger(argv)

        const { Proxy } = require('./proxy')

        mkdirp.sync(argv['certs-directory'])

        const proxy = new Proxy({certsDir: argv['certs-directory'], serverKeyLength: argv['server-key-length'], defaultCaCommonName: argv['default-ca-common-name']})

        proxy.listen(argv.port, () => {
            const address = proxy.server.address()

            logger.info(`proxy listening on ${address.address}:${address.port}`)
        })

        if (argv.log) {
            proxy.on('beep', (transaction) => {
                logger.info(`${transaction.method} ${transaction.uri} ${transaction.responseCode} ${transaction.responseMessage}`)
            })
        }

        if (argv.text) {
            require('./text').handler(argv, proxy)
        }

        if (argv.ws) {
            require('./ws').handler(argv, proxy)
        }
    }
}
