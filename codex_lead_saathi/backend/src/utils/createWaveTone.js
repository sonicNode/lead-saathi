function createWaveTone(options = {}) {
  const durationSeconds = options.durationSeconds || 1.2;
  const frequency = options.frequency || 440;
  const sampleRate = options.sampleRate || 24000;
  const volume = options.volume || 0.18;

  const sampleCount = Math.floor(durationSeconds * sampleRate);
  const dataSize = sampleCount * 2;
  const dataBuffer = Buffer.alloc(dataSize);

  for (let index = 0; index < sampleCount; index += 1) {
    const sample =
      Math.sin((2 * Math.PI * frequency * index) / sampleRate) *
      32767 *
      volume;
    dataBuffer.writeInt16LE(sample, index * 2);
  }

  const headerBuffer = Buffer.alloc(44);
  headerBuffer.write("RIFF", 0);
  headerBuffer.writeUInt32LE(36 + dataSize, 4);
  headerBuffer.write("WAVE", 8);
  headerBuffer.write("fmt ", 12);
  headerBuffer.writeUInt32LE(16, 16);
  headerBuffer.writeUInt16LE(1, 20);
  headerBuffer.writeUInt16LE(1, 22);
  headerBuffer.writeUInt32LE(sampleRate, 24);
  headerBuffer.writeUInt32LE(sampleRate * 2, 28);
  headerBuffer.writeUInt16LE(2, 32);
  headerBuffer.writeUInt16LE(16, 34);
  headerBuffer.write("data", 36);
  headerBuffer.writeUInt32LE(dataSize, 40);

  return Buffer.concat([headerBuffer, dataBuffer]);
}

module.exports = {
  createWaveTone
};
