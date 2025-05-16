import type { IProviderModule, IProviderModuleNaked } from '@adimm/x-injection';

import type { IComponentProviderModuleNaked } from './component-provider-module-naked.interface';

export interface IComponentProviderModule extends IProviderModule {
  /**
   * Casts the current module type to the {@link IComponentProviderModuleNaked} type.
   *
   * **Internally used and for testing purposes!**
   */
  toNaked(): IComponentProviderModuleNaked & IProviderModuleNaked;

  /**
   * Should be invoked only when the component is not needed anymore.
   *
   * _eg: When changing page, removable components and so on._
   */
  dispose(): Promise<void>;
}
