import type { IComponentProviderModule } from './component-provider-module.interface';

export interface IComponentProviderModuleNaked extends IComponentProviderModule {
  /** Indicates if this module has been initialized by a React Component or not. */
  _initializedFromComponent: boolean;

  /**
   * It is used internally by the `ProviderModule` to create a new cloned
   * module which will be consumed only by that specific component instance.
   */
  _createContextualizedComponentInstance(): IComponentProviderModule;
}
