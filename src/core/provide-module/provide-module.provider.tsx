import React, { useMemo } from 'react';

import { forwardPropsWithModule, useContextualizedModule } from '../../helpers';
import type { IComponentProviderModule } from '../../types';
import { REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT } from '../react-context';

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
 * function MyComponent({ firstName, lastName }: MyComponentProps) {
 *   const service = useInject(MyComponentService);
 *
 *   return <h1>Hello {service.computeUserName(firstName, lastName)}!</h1>
 * }
 *
 * function App() {
 *   return (
 *     <ProvideModule module={MyComponentModule}>
 *       <MyComponent firstName={'John'} lastName={'Doe'} />
 *     </ProvideModule>
 *   );
 * }
 * ```
 *
 * @param param0 See {@link ProvideModuleFunctionParams}.
 * @returns The provided {@link toComponent | Component}.
 */
export function ProvideModule({ module, children }: ProvideModuleFunctionParams) {
  /* istanbul ignore next */
  const componentProps = (children.props ?? {}) as any;
  const moduleCtx = useContextualizedModule(module, componentProps.module);
  const component = useMemo(
    () => React.cloneElement(children, forwardPropsWithModule(children, componentProps, moduleCtx)),
    [componentProps, moduleCtx]
  );

  return (
    <REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT.Provider value={moduleCtx}>
      {component}
    </REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT.Provider>
  );
}

export interface ProvideModuleFunctionParams {
  /** The {@link IComponentProviderModule | Module} which should be consumed by the {@link children | component}. */
  module: IComponentProviderModule;

  children: React.ReactElement;
}
