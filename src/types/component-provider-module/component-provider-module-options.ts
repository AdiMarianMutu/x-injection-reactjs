import type { ProviderModuleOptions } from '@adimm/x-injection';

export interface ComponentProviderModuleOptions extends ProviderModuleOptions {
  /**
   * When set to `true`, it'll automatically `contextualize` all the `imports` array.
   *
   * **Note:** _This is required when you have a parent component which renders one or more children
   * and does also need to control their providers._
   * _If not set to `true`, then the children providers would be resolved from their original `module`, therefore_
   * _if your parent component has multiple instances of itself, all its children will actually share_
   * _the same providers, especially when their module injection scope is set to `Singleton` (by default)._
   *
   * **Note2:** _If a module has {@link ProviderModuleOptions.markAsGlobal | markAsGlobal} set to `true`,_
   * _this will automatically default to `false`._
   *
   * Defaults to `true`.
   */
  contextualizeImports?: boolean;
}
