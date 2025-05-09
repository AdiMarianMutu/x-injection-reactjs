import { useState } from 'react';

export function useRerender(): () => void {
  const [, setRerender] = useState(0);

  return () => setRerender((x) => x + 1);
}
