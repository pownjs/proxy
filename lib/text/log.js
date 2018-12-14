const {
    Log: BlessedLog
} = require('@pown/blessed')

class Log extends BlessedLog {
    constructor(options) {
        options = {
            label: 'Log',

            ...options,

            tags: true
        }

        super(options)
    }
}

module.exports = Log
