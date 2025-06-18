import { isFunction, type ModuleOrBlueprint } from '@adimm/x-injection';

import type { ReactElementWithProviderModule } from '../core';
import type { PropsWithModule } from '../types';

export namespace ComponentProviderModuleHelpers {
  export function forwardPropsWithModule<P extends Record<string, any>>(
    component: ReactElementWithProviderModule<P> | React.ReactElement,
    props: Record<string, any>,
    module: ModuleOrBlueprint
  ): PropsWithModule<P> {
    const isReactElement = typeof component === 'object' && 'type' in component;

    const result = {
      ...props,
    } as any;

    if ((isReactElement && isFunction(component.type)) || isFunction(component)) {
      result['module'] = module;
    }

    return result;
  }
}
