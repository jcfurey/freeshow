/**
 * AudioWorklet processor for LTC (Linear/Longitudinal Timecode) audio input.
 * Buffers incoming samples (converted to 8-bit unsigned) and posts them to the
 * main thread in fixed-size chunks for decoding.
 *
 * Committed as a plain .js worklet (loaded via a relative `./assets/...` path,
 * matching the other audio worklets) rather than a Vite `?worker&url` import,
 * which baked an absolute `/assets/...` URL that 404s under file://.
 */
const BUFFER_SIZE = 4096

class LTCProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.buffer = new Uint8Array(BUFFER_SIZE)
        this.index = 0
    }

    process(inputs) {
        const input = inputs[0]
        if (input && input.length > 0) {
            const channelData = input[0]

            for (let i = 0; i < channelData.length; i++) {
                let s = Math.max(-1, Math.min(1, channelData[i]))
                s = s * 128 + 128
                this.buffer[this.index++] = Math.floor(s)

                if (this.index >= BUFFER_SIZE) {
                    this.port.postMessage(this.buffer.slice(0, BUFFER_SIZE))
                    this.index = 0
                }
            }
        }
        return true
    }
}

registerProcessor("ltc-processor", LTCProcessor)
