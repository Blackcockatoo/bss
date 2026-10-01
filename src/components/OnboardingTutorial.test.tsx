import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { OnboardingTutorial } from './OnboardingTutorial';

it('keeps the tutorial outside transformed/clipped pet ancestors and persists dismissal', async () => {
  localStorage.removeItem('metapet-onboarding-pet');
  render(<div style={{ transform: 'translateZ(0)', overflow: 'hidden' }}><OnboardingTutorial scope="pet" /></div>);
  const dialog = await screen.findByRole('dialog', { name: 'Meta-Pet tutorial' });
  expect(dialog.parentElement).toBe(document.body);
  fireEvent.click(screen.getByRole('button', { name: /^Skip$/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(localStorage.getItem('metapet-onboarding-pet')).toBe('true');
});
