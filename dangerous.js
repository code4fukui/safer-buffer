import { Buffer } from "https://taisukef.github.io/buffer/Buffer.js";
import safer from "./safer.js";

const buffer = { Buffer, Safer: safer.Buffer };
const Safer = buffer.Safer;

var dangerous = {}

var key

for (key in safer) {
  if (!safer.hasOwnProperty(key)) continue
  dangerous[key] = safer[key]
}

var Dangereous = dangerous.Buffer = {}

// Copy Safer API
for (key in Safer) {
  if (!Safer.hasOwnProperty(key)) continue
  Dangereous[key] = Safer[key]
}

// Copy those missing unsafe methods, if they are present
for (key in Buffer) {
  if (!Buffer.hasOwnProperty(key)) continue
  if (Dangereous.hasOwnProperty(key)) continue
  Dangereous[key] = Buffer[key]
}

if (!Dangereous.allocUnsafe) {
  Dangereous.allocUnsafe = function (size) {
    if (typeof size !== 'number') {
      throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size)
    }
    if (size < 0 || size >= 2 * (1 << 30)) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"')
    }
    return Buffer(size)
  }
}

if (!Dangereous.allocUnsafeSlow) {
  Dangereous.allocUnsafeSlow = function (size) {
    if (typeof size !== 'number') {
      throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size)
    }
    if (size < 0 || size >= 2 * (1 << 30)) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"')
    }
    return buffer.SlowBuffer(size)
  }
}

export default dangerous
