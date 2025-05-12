import type { IComponentProviderModule } from './component-provider-module.interface';

export type PropsWithModule<P extends Record<string, any>> = P & {
  /**
   * The {@link IComponentProviderModule | Module} which this component should consume.
   *
   * **Note:** _You can easily override this in your unit tests to provide a module having mocked providers_
   * _without the need to create a new mocked component by using the composable `ProvideModule` method._
   */
  module?: IComponentProviderModule;
};
