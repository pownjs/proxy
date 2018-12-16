const EMPTY = Buffer.from('')

const buildHeaders = (headers) => {
    return Buffer.from([].concat(Object.entries(headers).map(([name, value]) => {
        if (!Array.isArray(value)) {
             value = [value]
        }

        return value.map((value) => {
            return `${name}: ${value}`
        }).join('\r\n')
    }), ['']).join('\r\n') + '\r\n')
}

const buildRequest = (request) => {
    const { method, uri, version, headers, body } = request

    const initialLine = Buffer.from(`${method} ${uri} ${version}\r\n`)

    const headersBuf = buildHeaders(headers)
    const bodyBuf = body

    return Buffer.concat([initialLine, headersBuf, bodyBuf])
}

const buildResponse = (response) => {
    const {responseVersion, responseCode, responseMessage, responseHeaders, responseBody } = response

    const initialLine = Buffer.from(`${responseVersion} ${responseCode} ${responseMessage}\r\n`)

    const headersBuf = buildHeaders(responseHeaders)
    const bodyBuf = responseBody

    return Buffer.concat([initialLine, headersBuf, bodyBuf])
}

const parseHeaders = (headersBuf) => {
    const headers = {}

    const search = '\r\n'

    let offset = 0

    while (true) {
        const lineEnd = headersBuf.indexOf(search, offset)

        if (lineEnd < 0) {
            break
        }

        const line = headersBuf.slice(offset, lineEnd)

        if (line.length === 0) {
            break
        }

        let keyEnd = line.indexOf(':')

        let name
        let value

        if (keyEnd < 0) {
            name = line
            value = EMPTY
        } else {
            name = line.slice(0, keyEnd)
            value = line.slice(keyEnd + 1).toString().replace(/^\s/, '')
        }

        if (headers[name]) {
            if (!Array.isArray(headers[name])) {
                headers[name] = [headers[name]]
            }

            headers[name].push(value)
        } else {
            headers[name] = value
        }

        offset = lineEnd + search.length
    }

    return headers
}

const parseRequest = (request) => {
    const initialLineSearch = '\r\n'
    const initialLineStart = 0
    const initialLineEnd = request.indexOf(initialLineSearch, initialLineStart) + initialLineSearch.length

    if (initialLineEnd < 0) {
        throw new Error(`Invalid request`)
    }

    const headersSearch = '\r\n\r\n'
    const headersStart = initialLineEnd
    const headersEnd = request.indexOf(headersSearch, headersStart) + headersSearch.length

    if (headersEnd < 0) {
        throw new Error(`Invalid request`)
    }

    const initialLine = request.slice(initialLineStart, initialLineEnd).toString().trim()
    const headers = parseHeaders(request.slice(headersStart, headersEnd))
    const body = request.slice(headersEnd)

    const [ method, uri, version ] = initialLine.split(' ')

    return { method, uri, version, headers, body }
}

const parseResponse = (response) => {
    const initialLineSearch = '\r\n'
    const initialLineStart = 0
    const initialLineEnd = response.indexOf(initialLineSearch, initialLineStart) + initialLineSearch.length

    if (initialLineEnd < 0) {
        throw new Error(`Invalid response`)
    }

    const headersSearch = '\r\n\r\n'
    const headersStart = initialLineEnd
    const headersEnd = response.indexOf(headersSearch, headersStart) + headersSearch.length

    if (headersEnd < 0) {
        throw new Error(`Invalid response`)
    }

    const initialLine = response.slice(initialLineStart, initialLineEnd).toString().trim()
    const responseHeaders = parseHeaders(response.slice(headersStart, headersEnd))
    const responseBody = response.slice(headersEnd)

    const [ responseVersion, responseCode, responseMessage ] = initialLine.split(' ')

    return { responseVersion, responseCode, responseMessage, responseHeaders, responseBody }
}

exports.buildHeaders = buildHeaders
exports.buildRequest = buildRequest
exports.buildResponse = buildResponse
exports.parseHeaders = parseHeaders
exports.parseRequest = parseRequest
exports.parseResponse = parseResponse
