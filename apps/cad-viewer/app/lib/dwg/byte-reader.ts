export class ByteReader {
  private view: DataView;
  private cursor = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  get length() {
    return this.view.byteLength;
  }

  tell() {
    return this.cursor;
  }

  seek(position: number) {
    if (position < 0 || position > this.length) {
      throw new Error(`seek out of range: ${position}`);
    }
    this.cursor = position;
  }

  readBytes(size: number) {
    const start = this.cursor;
    const end = start + size;
    if (end > this.length) {
      throw new Error(`read out of range: ${start}..${end}`);
    }
    this.cursor = end;
    return new Uint8Array(this.view.buffer.slice(start, end));
  }

  readAscii(size: number) {
    const bytes = this.readBytes(size);
    return String.fromCharCode(...bytes);
  }
}
