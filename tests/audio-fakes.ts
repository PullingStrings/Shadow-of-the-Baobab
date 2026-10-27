class Parameter {
  value = 0; target = 0;
  cancelScheduledValues() {}
  setTargetAtTime(value: number) { this.target = value; }
}
export class Node {
  gain = new Parameter(); pan = new Parameter(); threshold = new Parameter(); knee = new Parameter(); ratio = new Parameter(); attack = new Parameter(); release = new Parameter();
  onended: (() => void) | null = null; loop = false; buffer: unknown;
  startedAt = 0;
  connect() {} disconnect() {} start(at = 0) { this.startedAt = at; } stop() { this.onended?.(); }
}
export class Context {
  state = 'suspended'; currentTime = 0; destination = new Node(); gains: Node[] = []; resumes = 0; sources: Node[] = [];
  createGain() { const node = new Node(); this.gains.push(node); return node; }
  createDynamicsCompressor() { return new Node(); }
  createStereoPanner() { return new Node(); }
  createBufferSource() { const node = new Node(); this.sources.push(node); return node; }
  createBuffer(_channels: number, length: number) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  async resume() { this.resumes++; this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}
