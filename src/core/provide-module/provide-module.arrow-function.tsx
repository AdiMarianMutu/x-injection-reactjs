import React from 'react';

import { ComponentProviderModuleHelpers, useContextualizedModule } from '../../helpers';
import type { IComponentProviderModule, PropsWithModule } from '../../types';
import { REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT } from '../react-context';

const ComponentRenderer = React.memo(_ComponentRenderer);

/**
 * Can be used to easily provide a {@link module} to any component.
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
 * @param module The {@link IComponentProviderModule | Module} which should be consumed by the {@link component}.
 * @returns The provided {@link toComponent | Component}.
 */
export function provideModuleToComponent<
  P extends Record<string, any>,
  C extends ReactElementWithProviderModule<P> = ReactElementWithProviderModule<P>,
>(module: IComponentProviderModule, component: ReactElementWithProviderModule<P>): C {
  return ((componentProps: PropsWithModule<P>) => {
    const moduleCtx = useContextualizedModule(module, componentProps.module);

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
  module: IComponentProviderModule;
  component: ReactElementWithProviderModule<P>;
  componentProps: P;
}) {
  return <>{component(ComponentProviderModuleHelpers.forwardPropsWithModule(component, componentProps, module))}</>;
}

export type ReactElementWithProviderModule<P extends Record<string, any>> = (p: PropsWithModule<P>) => React.ReactNode;
