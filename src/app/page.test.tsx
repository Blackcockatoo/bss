import { render, screen, within } from '@testing-library/react';
import HomePage from './page';

describe('landing page navigation structure', () => {
  it('keeps nav/section ids aligned with the seven chamber model', () => {
    const { container } = render(<HomePage />);

    const expectedNavIds = ['parents', 'schools', 'veil', 'schoolDocs', 'investors', 'strategy', 'ads'] as const;
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();

    for (const id of expectedNavIds) {
      expect(container.querySelector(`section#${id}`)).toBeInTheDocument();
      expect((nav as HTMLElement).querySelector(`a[href="#${id}"]`)).toBeInTheDocument();
    }

    expect(within(nav as HTMLElement).getByRole('link', { name: /school docs/i })).toBeInTheDocument();

    for (let layer = 1; layer <= 7; layer += 1) {
      expect(screen.getByText(new RegExp(`Layer ${layer}\\b`, 'i'))).toBeVisible();
    }
  });
});
