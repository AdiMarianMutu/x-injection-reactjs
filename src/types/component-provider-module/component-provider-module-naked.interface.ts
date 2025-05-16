import type { ComponentProviderModuleOptions } from './component-provider-module-options';
import type { IComponentProviderModule } from './component-provider-module.interface';

export interface IComponentProviderModuleNaked extends IComponentProviderModule {
  /**
   * The original `id` which was assigned to this module.
   *
   * **Note:** _The module initial {@link ComponentProviderModuleOptions.identifier | id} will be suffixed with `Contextualized`._
   */
  originalIdentifier: symbol;

  /** See {@link ComponentProviderModuleOptions.contextualizeImports}. */
  hasContextualizedImports: ComponentProviderModuleOptions['contextualizeImports'];

  /** Indicates if this module has been initialized by a React Component or not. */
  initializedFromComponent: boolean;

  /**
   * It is used internally by the `ProviderModule` to create a new cloned
   * module which will be consumed only by that specific component instance.
   */
  _createContextualizedComponentInstance(parentIdentifier?: symbol): IComponentProviderModule;
}
