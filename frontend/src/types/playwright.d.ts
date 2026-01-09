declare module '@playwright/test' {
  export const test: any;
  export const expect: any;
  export type Page = any;
  export const devices: any;
  export function defineConfig(config: any): any;
  export function devicesList(): any;
  export default { test, expect, devices, defineConfig };
}
