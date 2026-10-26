import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppActivitiesPage from './page';

const query = vi.hoisted(() => ({ tab: 'navigator' }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams({ tab: query.tab }) }));
vi.mock('@/components/FeaturesDashboard', () => ({
  FeaturesDashboard: function Dashboard({ initialTab }: { initialTab: string }) {
    const [tab] = useState(initialTab);
    return <div data-testid="activity">{tab}</div>;
  },
}));

describe('activity destination changes', () => {
  it('opens the requested activity after same-page navigation and browser back', () => {
    query.tab = 'navigator';
    const view = render(<AppActivitiesPage />);
    expect(screen.getByTestId('activity')).toHaveTextContent('navigator');
    query.tab = 'vimana';view.rerender(<AppActivitiesPage />);
    expect(screen.getByTestId('activity')).toHaveTextContent('vimana');
    query.tab = 'achievements';view.rerender(<AppActivitiesPage />);
    expect(screen.getByTestId('activity')).toHaveTextContent('achievements');
    query.tab = 'navigator';view.rerender(<AppActivitiesPage />);
    expect(screen.getByTestId('activity')).toHaveTextContent('navigator');
  });
});
