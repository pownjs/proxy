exports.packTransaction = ({requestBuf, responseBuf}) => {
    const headerBuf = Buffer.alloc(4 + 4)

    headerBuf.writeUInt32BE(3, 0)
    headerBuf.writeUInt32BE(requestBuf.byteLength, 4)

    const messageBuf = Buffer.concat([headerBuf, requestBuf, responseBuf])

    return messageBuf
}

exports.unpackTransaction = (messageBuf) => {
    const type = messageBuf.readUInt32BE(0)

    if (type !== 3) {
        throw new Error(`Invalid transaction`)
    }

    const length = messageBuf.readUInt32BE(4)
    const offset = 4 + 4
    const requestBuf = messageBuf.slice(offset, offset + length)
    const responseBuf = messageBuf.slice(offset + length)

    return { requestBuf, responseBuf }
}
