import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/lib/store';
import { PetResponseOverlay } from './PetResponseOverlay';

const response = vi.hoisted(() => ({
  trigger: vi.fn(),
  item: { id: 'authored-reaction', text: 'That was fun. Let’s try another pattern!', emoji: '✨' },
}));
vi.mock('@/lib/realtime/useRealtimeResponse', () => ({
  useRealtimeResponse: () => ({
    currentResponse: response.item, isVisible: true, triggerResponse: response.trigger,
    responseHistory: [response.item],
  }),
}));
const initialVitals = useStore.getState().vitals;
afterEach(() => { useStore.setState({ vitals: initialVitals });vi.clearAllMocks(); });

describe('companion feedback', () => {
  it('keeps authored feedback inline and history collapsed until requested', () => {
    const view = render(<PetResponseOverlay enableAudio={false} />);
    expect(screen.getByRole('status')).toHaveTextContent(response.item.text);
    expect(view.container.querySelector('.fixed')).toBeNull();
    const history = screen.getByText('Recent companion responses').closest('details')!;
    expect(history.open).toBe(false);
    fireEvent.click(screen.getByText('Recent companion responses'));
    expect(history.open).toBe(true);
    expect(history).toHaveTextContent(response.item.text);
  });

  it('reacts to a real play-sized mood increase but not passive ticks', () => {
    useStore.setState({ vitals: { ...initialVitals, mood: 40 } });
    render(<PetResponseOverlay enableAudio={false} />);
    act(() => useStore.setState({ vitals: { ...initialVitals, mood: 41 } }));
    expect(response.trigger).not.toHaveBeenCalled();
    act(() => useStore.setState({ vitals: { ...initialVitals, mood: 55 } }));
    expect(response.trigger).toHaveBeenCalledWith('play');
    expect(response.trigger).toHaveBeenCalledTimes(1);
  });
});
