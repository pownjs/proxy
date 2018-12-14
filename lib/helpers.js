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
    const initialLine = Buffer.from(`${request.method} ${request.uri} HTTP/${request.version}\r\n`)

    const headers = buildHeaders(request.headers)
    const body = request.body

    return Buffer.concat([initialLine, headers, body])
}

const buildResponse = (response) => {
    const initialLine = Buffer.from(`HTTP/${response.responseVersion} ${response.responseCode} ${response.responseMessage}\r\n`)

    const headers = buildHeaders(response.responseHeaders)
    const body = response.responseBody

    return Buffer.concat([initialLine, headers, body])
}

exports.buildHeaders = buildHeaders
exports.buildRequest = buildRequest
exports.buildResponse = buildResponse
