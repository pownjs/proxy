const {
    Box
} = require('@pown/blessed')

class Help extends Box {
    constructor(options) {
        options = {
            label: 'Help',

            ...options,

            tags: true,

            content: `
\t{bold}C-l{/bold} - Display message log
\t{bold}Tab{/bold} - Change focus
\t{bold}C-c, C-x, q{/bold} - Exit
`
        }

        super(options)
    }
}


module.exports = Help
