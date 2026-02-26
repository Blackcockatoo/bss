import React from 'react';

// This is a placeholder provider. In a full implementation, this would
// manage feature toggles that can be changed at runtime (e.g., from a settings screen).
// For now, it just provides the static config.

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real app, you might load persisted feature states here (e.g., from MMKV)
  // and provide them via a context.
  return <>{children}</>;
};
