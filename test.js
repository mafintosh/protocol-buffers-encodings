var tape = require('tape')
var encodings = require('./')

tape('name', function (t) {
  t.same(encodings.name(encodings.varint), 'varint')
  t.same(encodings.name(encodings.float), 'float')
  t.end()
})

tape('varint', function (t) {
  test(t, encodings.varint, [42, 10, 0, 999999])
})

tape('string', function (t) {
  test(t, encodings.string, ['a', 'abefest', 'øøø'])
})

tape('bytes', function (t) {
  test(t, encodings.bytes, [Buffer.alloc(4096), Buffer.from('hi')])
  // TODO: Fails because it is a Buffer. Manually add Uint8Array option?
})

tape('bool', function (t) {
  test(t, encodings.bool, [true, false])
})

tape('int32', function (t) {
  test(t, encodings.int32, [-1, 0, 42, 4242424])
})

tape('int64', function (t) {
  test(t, encodings.int64, [-1, 0, 1, 24242424244])
})

tape('sint64', function (t) {
  test(t, encodings.sint64, [-14, 0, 144, 4203595524])
})

tape('uint64', function (t) {
  test(t, encodings.uint64, [1, 0, 144, 424444, 4203595524])
})

tape('fixed64', function (t) {
  test(t, encodings.fixed64, [Buffer.from([0, 0, 0, 0, 0, 0, 0, 1])])
  // TODO: Fails because it is a Buffer. Manually add Uint8Array option?
})

tape('double', function (t) {
  test(t, encodings.double, [0, 2, 0.5, 0.4])
  // TODO: Fails because writeDoubleLE is not supported by b4a
})

tape('float', function (t) {
  test(t, encodings.float, [0, 2, 0.5])
  // TODO: Fails because writeFloatLE is not supported by b4a
})

tape('fixed32', function (t) {
  test(t, encodings.fixed32, [4, 0, 10000])
  // TODO: Fails because writeUInt32LE is not supported by b4a
})

tape('sfixed32', function (t) {
  test(t, encodings.sfixed32, [-100, 4, 0, 142425])
  // TODO: Fails because writeInt32LE is not supported by b4a
})

function test (t, enc, vals) {
  if (!Array.isArray(vals)) vals = [vals]

  var allocFunctions = [
    (length) => Buffer.alloc(length), // Node style
    (length) => new Uint8Array(length) // Browser style
  ]

  for (var allocFunction of allocFunctions) {
    for (var i = 0; i < vals.length; i++) {
      var val = vals[i]
      var buf = allocFunction(enc.encodingLength(val))

      enc.encode(val, buf, 0)

      t.same(enc.encode.bytes, buf.length)
      t.same(enc.encodingLength(val), buf.length)
      t.same(enc.decode(buf, 0), val)
      t.same(enc.decode.bytes, buf.length)

      var anotherBuf = allocFunction(enc.encodingLength(val) + 1000)

      buf = enc.encode(val, anotherBuf, 10)
      t.same(buf, anotherBuf)
      t.ok(enc.encode.bytes < anotherBuf.length)
      t.same(enc.decode(buf, 10, 10 + enc.encodingLength(val)), val)
      t.ok(enc.decode.bytes < anotherBuf.length)
    }
  }

  t.end()
}

tape('test browser-style buffer', function (t) {
  var enc = encodings.string
  var val = 'value'
  var buf = new Uint8Array(enc.encodingLength(val))
  enc.encode(val, buf, 0)

  // First elem is the length (5). Others are the encoded 'value'
  var expectedEncodedVal = new Uint8Array([5, 118, 97, 108, 117, 101])
  t.same(buf, expectedEncodedVal)

  t.same(enc.encode.bytes, buf.length)
  t.same(enc.encodingLength(val), buf.length)
  t.same(enc.decode(buf, 0), val)
  t.same(enc.decode.bytes, buf.length)

  var anotherBuf = new Uint8Array(enc.encodingLength(val) + 1000)

  buf = enc.encode(val, anotherBuf, 10)
  t.same(buf, anotherBuf)
  t.ok(enc.encode.bytes < anotherBuf.length)
  t.same(enc.decode(buf, 10, 10 + enc.encodingLength(val)), val)
  t.ok(enc.decode.bytes < anotherBuf.length)

  t.end()
})
