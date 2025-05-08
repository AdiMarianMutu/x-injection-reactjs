import type { IComponentProviderModule } from '../../../types';

export interface TapIntoComponentContextProps {
  children: React.ReactNode;

  /**
   * A callback can be provided to fully get access to the `ProviderModule` of the component instance,
   * as long as the component is exposing it by using the `useExposeComponentModuleContext` hook.
   *
   * @param ctx A context map of modules.
   *
   * @example
   * ```tsx
   * function UserComponent(props: UserComponentProps) {
   *   // This is required in order to correctly expose the ctx!
   *   useExposeComponentModuleContext();
   *
   *   const [userProfileSettings, userSecuritySettings] = useInjectMany({ deps: [UserProfileSettings, UserSecuritySettings] });
   *
   *   return null;
   * }
   *
   * function UserPage(props: UserPageProps) {
   *   return (
   *     <TapIntoComponent
   *       contextInstance={(ctx)) => ({
   *         tryGet: UserComponentModule,
   *         thenDo: (ctx) => {
   *           const services = ctx.getMany(...);
   *         }
   *       })}>
   *       <UserComponent {...props.userComponentProps} />
   *     </TapIntoComponent>
   *   );
   * }
   * ```
   *
   * **Or without the fluid syntax:**
   *
   * ```tsx
   * function UserPage(props: UserPageProps) {
   *   return (
   *     <TapIntoComponent
   *       contextInstance={(ctxMap)) => {
   *         const ctx = ctxMap.get(UserComponentModule.toString());
   *         if (!ctx) return;
   *
   *         const services = ctx.getMany(...);
   *       }}>
   *       <UserComponent {...props.userComponentProps} />
   *     </TapIntoComponent>
   *   );
   * }
   * ````
   */
  contextInstance?: (ctx: Map<string, IComponentProviderModule>) => void | WithComponentInstanceCtxFluidSyntax;
}

export interface WithComponentInstanceCtxFluidSyntax {
  /** The {@link IComponentProviderModule | module} to look for in the `context map`. */
  tryGet: IComponentProviderModule;

  /**
   * Provide a callback which will be invoked when the `context map` has
   * the {@link tryGet | module} requested.
   *
   * @param module The contextualized instance of the {@link IComponentProviderModule} extracted from the children.
   */
  thenDo: (module: IComponentProviderModule) => void | Promise<void>;
}
