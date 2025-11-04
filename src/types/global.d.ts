// Global type fallbacks for environment-specific APIs used by third-party types
// Provide a minimal GPUTexture type used by @types/three when WebGPU types are absent.

declare type GPUTexture = any;

export {};
