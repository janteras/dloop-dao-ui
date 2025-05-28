import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';

// Test wrapper to provide any necessary providers for hooks
export function TestWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Custom render function for components
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}
