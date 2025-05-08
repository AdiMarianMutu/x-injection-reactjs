import type { ProviderModuleOptions } from '@adimm/x-injection';

import type { IComponentProviderModule } from './component-provider-module.interface';

export interface IComponentProviderModuleNaked extends IComponentProviderModule {
  /** Indicates if this module has been initialized by a React Component or not. */
  _initializedFromComponent: boolean;

  /** The {@link ProviderModuleOptions | options} with which the module has been originally initialized. */
  _initialOptions: ProviderModuleOptions;

  /**
   * Instantiate a new {@link IComponentProviderModule} which will be supplied to the React Component.
   *
   * All the `providers` will be injected into a `singleton` scope.
   */
  _convertToContextualizedComponentInstance(): IComponentProviderModule;
}
