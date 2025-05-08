import React, { useCallback } from 'react';
import type { Except } from 'type-fest';

import { ModuleProvider } from '../src';
import type { ModuleProviderProps } from '../src/core/providers/module-provider/models';

export function _ComponentWithProviderModule({
  moduleProps,
  cb,
}: {
  moduleProps: Except<ModuleProviderProps, 'children'>;
  cb?: () => React.ReactNode;
}) {
  // This is needed to correctly keep the react context intact.
  const CB = useCallback(() => cb?.(), []);

  return (
    <ModuleProvider {...moduleProps}>
      <CB />
    </ModuleProvider>
  );
}
