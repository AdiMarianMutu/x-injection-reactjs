import type { IProviderModule, ModuleOrBlueprint } from '@adimm/x-injection';
import React from 'react';

import { ComponentProviderModuleHelpers, useMakeOrGetComponentModule } from '../helpers';
import type { PropsWithModule } from '../types';
import { REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT } from './react-context';

const ComponentRenderer = React.memo(_ComponentRenderer);

/**
 * Can be used to easily provide a {@link module} to a component.
 *
 * **Note:** _An error will be thrown if a `global` module is provided._
 *
 * @example
 * ```tsx
 * interface MyComponentProps {
 *   firstName: string;
 *   lastName: string;
 * }
 *
 * export const MyComponent = provideModuleToComponent<MyComponentProps>(
 *   MyComponentModule,
 *   ({ firstName, lastName }) => {
 *     const service = useInject(MyComponentService);
 *
 *     return <h1>Hello {service.computeUserName(firstName, lastName)}!</h1>
 *   }
 * );
 *
 * function App() {
 *   return <MyComponent firstName={'John'} lastName={'Doe'} />;
 * }
 * ```
 *
 * @param module The {@link ModuleOrBlueprint} which should be consumed by the {@link component}.
 * @returns The provided {@link toComponent | Component}.
 */
export function provideModuleToComponent<
  P extends Record<string, any>,
  C extends ReactElementWithProviderModule<P> = ReactElementWithProviderModule<P>,
>(module: ModuleOrBlueprint, component: ReactElementWithProviderModule<P>): C {
  return ((componentProps: PropsWithModule<P>) => {
    const moduleCtx = useMakeOrGetComponentModule(module, componentProps);

    return (
      <REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT.Provider value={moduleCtx}>
        <ComponentRenderer module={moduleCtx} componentProps={componentProps} component={component as any} />
      </REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT.Provider>
    );
  }) as any;
}

function _ComponentRenderer<P extends Record<string, any>>({
  module,
  component,
  componentProps,
}: {
  module: IProviderModule;
  component: ReactElementWithProviderModule<P>;
  componentProps: P;
}) {
  return <>{component(ComponentProviderModuleHelpers.forwardPropsWithModule(component, componentProps, module))}</>;
}

export type ReactElementWithProviderModule<P extends Record<string, any>> = (p: PropsWithModule<P>) => React.ReactNode;
