import { useContext } from 'react';

import type { IComponentProviderModule } from '../../types';
import { REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT } from '../react-context';

/** Can be used to retrieve the {@link IComponentProviderModule} from the current context. */
export function useComponentModule(): IComponentProviderModule {
  return useContext(REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT);
}
