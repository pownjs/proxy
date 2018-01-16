#! /usr/bin/env node

const path = require('path')

process.env.POWN_ROOT = path.join(__dirname, '..')

require('pown-cli')
