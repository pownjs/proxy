const {
    Box
} = require('@pown/blessed')

class Bar extends Box {
    constructor(options) {
        options = {
            ...options,

            tags: true
        }

        super(options)

        this.messageBox = new Box({
            screen: this.screen,
            parent: this.parent,

            tags: true
        })

        this.append(this.messageBox)
    }

    setMessage(message) {
        this.messageBox.setContent(message)
    }
}

module.exports = Bar
