import React from 'react';

import { TEST_ID } from './constants';

export function WithTestId({ children }: React.PropsWithChildren) {
  return <div data-testid={TEST_ID}>{children}</div>;
}
