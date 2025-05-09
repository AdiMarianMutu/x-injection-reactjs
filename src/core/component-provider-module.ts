import {
  InjectionScope,
  isClass,
  isClassOrFunction,
  ProviderModule,
  ProviderModuleHelpers,
  type DependencyProvider,
  type IProviderModuleNaked,
  type ProviderClassToken,
  type ProviderModuleOptions,
  type ProviderValueToken,
} from '@adimm/x-injection';

import type { IComponentProviderModule, IComponentProviderModuleNaked } from '../types';

/** A superset of the {@link ProviderModule} used to integrate within a `React` component. */
export class ComponentProviderModule extends ProviderModule implements IComponentProviderModule {
  protected readonly _initializedFromComponent: IComponentProviderModuleNaked['_initializedFromComponent'];
  protected readonly _initialOptions: IComponentProviderModuleNaked['_initialOptions'];

  constructor(options: ProviderModuleOptions) {
    super(
      ProviderModuleHelpers.buildInternalConstructorParams({
        ...options,
        // By default components should have all their providers
        // defined as transient because a component may have more than one instance of itself.
        defaultScope: options.defaultScope ?? InjectionScope.Request,
        identifier: Symbol(`Component${options.identifier.description}`),
      })
    );

    this._initializedFromComponent = false;
    this._initialOptions = options;
  }

  override toNaked(): IComponentProviderModuleNaked & IProviderModuleNaked {
    return this as any;
  }

  /* istanbul ignore next */
  dispose(): void {
    this._dispose();
  }

  /**
   * **Publicly visible when the instance is casted to {@link IComponentProviderModuleNaked}.**
   *
   * See {@link IComponentProviderModuleNaked._convertToContextualizedComponentInstance}.
   */
  /* istanbul ignore next */
  protected _convertToContextualizedComponentInstance(): IComponentProviderModule {
    if (this.isAppModule || this.isDisposed) return this;

    const contextualizedProviders = this._getProviders().map((provider) => {
      if (!isClassOrFunction(provider)) {
        return {
          ...provider,
          scope: InjectionScope.Singleton,
        } as DependencyProvider;
      }

      if (isClass(provider)) {
        return {
          scope: InjectionScope.Singleton,
          provide: provider,
          useClass: provider,
        } as ProviderClassToken<any>;
      }

      return {
        provide: provider,
        useValue: provider,
      } as ProviderValueToken<any>;
    });

    const componentModule = new ComponentProviderModule({
      ...this._initialOptions,
      providers: contextualizedProviders,
    });

    //@ts-expect-error Read-only property.
    componentModule._initializedFromComponent = true;

    return componentModule;
  }
}
