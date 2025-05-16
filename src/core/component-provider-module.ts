import {
  InjectionScope,
  ProviderModule,
  ProviderModuleHelpers,
  ProviderModuleOptionsInternal,
  type IProviderModuleNaked,
  type ProviderModuleOptions,
} from '@adimm/x-injection';

import type { IComponentProviderModule, IComponentProviderModuleNaked } from '../types';

/** A superset of the {@link ProviderModule} used to integrate within a `React` component. */
export class ComponentProviderModule extends ProviderModule implements IComponentProviderModule {
  protected readonly _initializedFromComponent: IComponentProviderModuleNaked['_initializedFromComponent'];

  constructor(options: ProviderModuleOptions) {
    super(
      ProviderModuleHelpers.buildInternalConstructorParams({
        ...options,
        defaultScope: options.defaultScope ?? InjectionScope.Singleton,
        identifier: Symbol(`Component${options.identifier.description}`),
      })
    );

    this._initializedFromComponent = false;
  }

  override toNaked(): IComponentProviderModuleNaked & IProviderModuleNaked {
    return this as any;
  }

  /* istanbul ignore next */
  override clone(options?: Partial<ProviderModuleOptions>): IComponentProviderModule {
    const _options = options as ProviderModuleOptionsInternal;

    const clonedModule = new ComponentProviderModule(
      ProviderModuleHelpers.buildInternalConstructorParams({
        isAppModule: this.isAppModule,
        markAsGlobal: this.isMarkedAsGlobal,
        identifier: Symbol(this.identifier.description!.replace('Component', '')),
        defaultScope: this.defaultScope.native,
        dynamicExports: this.dynamicExports,
        onReady: this.onReady,
        onDispose: this.onDispose,
        importedProvidersMap: this.importedProvidersMap,
        imports: [...this.imports],
        providers: [...this.providers],
        exports: [...this.exports],
        ..._options,
      })
    );

    //@ts-expect-error Read-only method.
    clonedModule._initializedFromComponent = this._initializedFromComponent;

    return clonedModule;
  }

  /* istanbul ignore next */
  dispose(): void {
    this._dispose();
  }

  //#region IComponentProviderModuleNaked methods

  /**
   * **Publicly visible when the instance is casted to {@link IComponentProviderModuleNaked}.**
   *
   * See {@link IComponentProviderModuleNaked._createContextualizedComponentInstance}.
   */
  protected _createContextualizedComponentInstance(): IComponentProviderModule {
    if (this._initializedFromComponent) return this;

    const ctxModule = this.clone().toNaked();

    //@ts-expect-error Read-only property
    ctxModule.identifier = Symbol(`Contextualized${ctxModule.identifier.description}`);
    ctxModule._initializedFromComponent = true;

    return ctxModule;
  }

  //#endregion
}
