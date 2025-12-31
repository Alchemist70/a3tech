declare module 'hls.js' {
  interface HlsConfig {}
  class Hls {
    constructor(config?: HlsConfig);
    static isSupported(): boolean;
    loadSource(src: string): void;
    attachMedia(media: HTMLMediaElement): void;
    destroy(): void;
  }
  export default Hls;
}
