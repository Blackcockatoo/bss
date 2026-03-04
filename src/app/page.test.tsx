import { render, screen, within } from '@testing-library/react';
import HomePage from './page';

describe('landing page navigation structure', () => {
  it('keeps nav/section ids aligned and excludes removed schoolDocs and Layer 7', () => {
    const { container } = render(<HomePage />);

    const expectedNavIds = ['parents', 'schools', 'veil', 'investors', 'strategy', 'ads'] as const;
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();

    for (const id of expectedNavIds) {
      expect(container.querySelector(`section#${id}`)).toBeInTheDocument();
      expect((nav as HTMLElement).querySelector(`a[href="#${id}"]`)).toBeInTheDocument();
    }

    expect(within(nav as HTMLElement).queryByRole('link', { name: /school docs/i })).not.toBeInTheDocument();
    expect(container.querySelector('#schoolDocs')).not.toBeInTheDocument();

    for (let layer = 1; layer <= 6; layer += 1) {
      expect(screen.getByText(new RegExp(`Layer ${layer}\\b`, 'i'))).toBeVisible();
    }

    expect(screen.queryByText(/Layer 7\b/i)).not.toBeInTheDocument();
  });
});
