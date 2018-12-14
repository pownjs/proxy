const Table = require('@pown/blessed/lib/table')

class Transactions extends Table {
    constructor(options) {
        options = {
            columns: [{
                field: 'id',
                name: '#',
                width: 13
            }, {
                field: 'method',
                name: 'method',
                width: 7
            }, {
                field: 'scheme',
                name: 'scheme',
                width: 7
            }, {
                field: 'host',
                name: 'host',
                width: 13
            }, {
                field: 'port',
                name: 'port',
                width: 5
            }, {
                field: 'path',
                name: 'path',
                width: 42
            }, {
                field: 'query',
                name: 'query',
                width: 42
            }, {
                field: 'responseCode',
                name: 'code',
                width: 7
            }, {
                field: 'responseType',
                name: 'type',
                width: 13
            }, {
                field: 'responseLength',
                name: 'length',
                width: 21
            }],

            columnSpacing: 3,

            ...options
        }

        super(options)
    }
}

module.exports = Transactions
