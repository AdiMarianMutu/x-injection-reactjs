import type { ProviderModuleOptions } from '@adimm/x-injection';

import type { IComponentProviderModule } from '../../../../types';

export interface ModuleProviderProps {
  children?: React.ReactNode;

  render?: () => React.ReactNode;

  /** The {@link IComponentProviderModule | ComponentProviderModule} instance which must be accessible by this component. */
  module: IComponentProviderModule;

  /**
   * Provide an object containing the initialization {@link ProviderModuleConstructor | options} so the {@link ModuleProviderProps.module | module}
   * can be re-initialized when the component re-mounts _**(It'll happen only if it has been previously disposed!)**_.
   *
   * **Note:** _This is an advanced option and should be used only if you fully understand how the {@link ModuleProviderProps.module | module}_
   * _initialization process works!_
   * _For more details refer to the {@link https://adimarianmutu.github.io/x-injection/index.html | xInjection} offical docs._
   */
  tryReInitModuleOnMount?: ProviderModuleOptions;

  /**
   * When set to `true` it'll automatically dispose
   * the provided {@link ModuleProviderProps.module | module} during the
   * component `unmount` process.
   *
   * **Note:** _This is an advanced option and should be used only if you fully understand how the {@link ModuleProviderProps.module | module}_
   * _dispose process works!_
   * _For more details refer to the {@link https://adimarianmutu.github.io/x-injection/index.html | xInjection} offical docs._
   *
   * Defaults to `false`.
   */
  disposeModuleOnUnmount?: boolean;
}
