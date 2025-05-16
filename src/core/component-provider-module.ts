import {
  InjectionScope,
  ProviderModule,
  ProviderModuleHelpers,
  type IProviderModule,
  type IProviderModuleNaked,
  type ProviderModuleOptionsInternal,
} from '@adimm/x-injection';

import type { ComponentProviderModuleOptions, IComponentProviderModule, IComponentProviderModuleNaked } from '../types';

/** A superset of the {@link ProviderModule} used to integrate within a `React` component. */
export class ComponentProviderModule extends ProviderModule implements IComponentProviderModule {
  protected readonly originalIdentifier: symbol;
  protected readonly hasContextualizedImports: IComponentProviderModuleNaked['hasContextualizedImports'];
  protected readonly initializedFromComponent: IComponentProviderModuleNaked['initializedFromComponent'];

  constructor(options: ComponentProviderModuleOptions) {
    const identifier = Symbol(`Component${options.identifier.description}`);
    const contextualizeImports = options.markAsGlobal ? false : options.contextualizeImports ?? true;
    const contextualizedImportsCache: Map<string, IProviderModule> | undefined = contextualizeImports
      ? new Map()
      : undefined;

    super(
      ProviderModuleHelpers.buildInternalConstructorParams({
        ...options,
        defaultScope: options.defaultScope ?? InjectionScope.Singleton,
        identifier: identifier,
        imports: !contextualizeImports
          ? options.imports
          : options.imports?.map((imp) => {
              const module = (typeof imp === 'function' ? imp() : imp) as IComponentProviderModuleNaked;
              /* istanbul ignore next */
              if (!contextualizeImports) return module;

              return () => {
                const ctxModule = module._createContextualizedComponentInstance(identifier);

                contextualizedImportsCache!.set(module.originalIdentifier.toString(), ctxModule);

                return ctxModule;
              };
            }),
        dynamicExports: (_, exports) => {
          if (!contextualizeImports) return exports;

          return exports.map((exp) => {
            if (!(exp instanceof ProviderModule)) return exp;

            const cachedCtxModule = contextualizedImportsCache!.get(
              (exp as unknown as IComponentProviderModuleNaked).originalIdentifier.toString()
            )!;

            return cachedCtxModule;
          });
        },
      })
    );

    this.originalIdentifier = options.identifier;
    this.hasContextualizedImports = contextualizeImports;
    this.initializedFromComponent = false;
  }

  override toNaked(): IComponentProviderModuleNaked & IProviderModuleNaked {
    return this as any;
  }

  /* istanbul ignore next */
  override clone(options?: Partial<ComponentProviderModuleOptions>): IComponentProviderModule {
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
        contextualizeImports: this.hasContextualizedImports,
        importedProvidersMap: this.importedProvidersMap,
        imports: [...this.imports],
        providers: [...this.providers],
        exports: [...this.exports],
        ..._options,
      } as ComponentProviderModuleOptions)
    );

    //@ts-expect-error Read-only method.
    clonedModule.initializedFromComponent = this.initializedFromComponent;

    return clonedModule;
  }

  /* istanbul ignore next */
  override async dispose(): Promise<void> {
    await super.dispose();
  }

  //#region IComponentProviderModuleNaked methods

  /**
   * **Publicly visible when the instance is casted to {@link IComponentProviderModuleNaked}.**
   *
   * See {@link IComponentProviderModuleNaked._createContextualizedComponentInstance}.
   */
  protected _createContextualizedComponentInstance(parentIdentifier?: symbol): IComponentProviderModule {
    if (this.initializedFromComponent) return this;

    const ctxModule = this.clone().toNaked();

    /* istanbul ignore next */
    //@ts-expect-error Read-only property
    ctxModule.identifier = Symbol(
      `${parentIdentifier ? `[Parent:${parentIdentifier.description ?? 'Unknown'}]` : ''}Contextualized${ctxModule.identifier.description}`
    );
    ctxModule.initializedFromComponent = true;

    return ctxModule;
  }

  //#endregion
}
