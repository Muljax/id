/**
 * OpenSSH / RFC 4251 binary wire format serializer and deserializer.
 *
 * Implements native TypedArray and DataView serialization for:
 * - uint32: 32-bit unsigned integer (big-endian)
 * - uint64: 64-bit unsigned integer (big-endian)
 * - string / bytes: 32-bit length prefix followed by raw payload bytes
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Builds an RFC 4251 SSH wire format binary buffer using contiguous TypedArray allocation.
 */
export class SSHWriter {
	private buffer: Uint8Array;
	private view: DataView;
	private offset = 0;

	/**
	 * @param initialCapacity Initial allocated byte capacity (default: 512 bytes).
	 */
	constructor(initialCapacity = 512) {
		this.buffer = new Uint8Array(initialCapacity);
		this.view = new DataView(this.buffer.buffer);
	}

	/**
	 * Ensures the internal buffer has enough remaining capacity for the required byte count.
	 */
	private ensureCapacity(requiredBytes: number): void {
		const needed = this.offset + requiredBytes;
		if (needed <= this.buffer.length) {
			return;
		}

		let nextCapacity = this.buffer.length * 2;
		while (nextCapacity < needed) {
			nextCapacity *= 2;
		}

		const nextBuffer = new Uint8Array(nextCapacity);
		nextBuffer.set(this.buffer.subarray(0, this.offset));
		this.buffer = nextBuffer;
		this.view = new DataView(this.buffer.buffer);
	}

	/**
	 * Writes a 32-bit unsigned integer in network byte order (big-endian).
	 *
	 * @param value 32-bit unsigned integer.
	 */
	writeUint32(value: number): this {
		this.ensureCapacity(4);
		this.view.setUint32(this.offset, value, false);
		this.offset += 4;
		return this;
	}

	/**
	 * Writes a 64-bit unsigned integer in network byte order (big-endian).
	 *
	 * @param value 64-bit unsigned bigint.
	 */
	writeUint64(value: bigint): this {
		this.ensureCapacity(8);
		this.view.setBigUint64(this.offset, value, false);
		this.offset += 8;
		return this;
	}

	/**
	 * Writes a UTF-8 string prefixed by its 32-bit byte length.
	 *
	 * @param value UTF-8 string.
	 */
	writeString(value: string): this {
		const encoded = encoder.encode(value);
		this.writeBytes(encoded);
		return this;
	}

	/**
	 * Writes a byte array prefixed by its 32-bit byte length.
	 *
	 * @param value Binary byte payload.
	 */
	writeBytes(value: Uint8Array): this {
		this.writeUint32(value.length);
		this.writeRaw(value);
		return this;
	}

	/**
	 * Writes raw bytes directly without a length prefix.
	 *
	 * @param value Binary bytes to append.
	 */
	writeRaw(value: Uint8Array): this {
		this.ensureCapacity(value.length);
		this.buffer.set(value, this.offset);
		this.offset += value.length;
		return this;
	}

	/**
	 * Returns a zero-copy Uint8Array view of all written bytes.
	 */
	toUint8Array(): Uint8Array {
		return this.buffer.subarray(0, this.offset);
	}
}

/**
 * Parses an RFC 4251 SSH wire format binary buffer using DataView.
 */
export class SSHReader {
	private view: DataView;
	private offset = 0;

	/**
	 * @param buffer Binary buffer to parse.
	 */
	constructor(private buffer: Uint8Array) {
		this.view = new DataView(
			buffer.buffer,
			buffer.byteOffset,
			buffer.byteLength,
		);
	}

	/**
	 * Returns the number of unconsumed bytes remaining.
	 */
	get remaining(): number {
		return this.buffer.length - this.offset;
	}

	/**
	 * Checks if there are more bytes left to read.
	 */
	hasRemaining(): boolean {
		return this.offset < this.buffer.length;
	}

	/**
	 * Reads a 32-bit unsigned integer in network byte order (big-endian).
	 */
	readUint32(): number {
		if (this.offset + 4 > this.buffer.length) {
			throw new Error("Unexpected end of SSH buffer while reading uint32");
		}
		const val = this.view.getUint32(this.offset, false);
		this.offset += 4;
		return val;
	}

	/**
	 * Reads a 64-bit unsigned integer in network byte order (big-endian).
	 */
	readUint64(): bigint {
		if (this.offset + 8 > this.buffer.length) {
			throw new Error("Unexpected end of SSH buffer while reading uint64");
		}
		const val = this.view.getBigUint64(this.offset, false);
		this.offset += 8;
		return val;
	}

	/**
	 * Reads a byte array prefixed by a 32-bit length.
	 */
	readBytes(): Uint8Array {
		const length = this.readUint32();
		if (this.offset + length > this.buffer.length) {
			throw new Error("Unexpected end of SSH buffer while reading bytes");
		}
		const slice = this.buffer.subarray(this.offset, this.offset + length);
		this.offset += length;
		return slice;
	}

	/**
	 * Reads a UTF-8 string prefixed by a 32-bit length.
	 */
	readString(): string {
		const bytes = this.readBytes();
		return decoder.decode(bytes);
	}

	/**
	 * Reads all remaining unconsumed bytes.
	 */
	readRemaining(): Uint8Array {
		const slice = this.buffer.subarray(this.offset);
		this.offset = this.buffer.length;
		return slice;
	}
}
