import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MomentumGraph } from './MomentumGraph';

describe('MomentumGraph', () => {
  const mockActions = [
    { actionNumber: 1, wallTimeOffset: 0, scoreHome: '0', scoreAway: '0', period: 1, clock: 'PT12M00.00S', actionType: 'start', description: 'Start' } as any,
    { actionNumber: 2, wallTimeOffset: 60, scoreHome: '2', scoreAway: '0', period: 1, clock: 'PT11M00.00S', actionType: '2pt', description: 'Made' } as any,
    { actionNumber: 3, wallTimeOffset: 120, scoreHome: '2', scoreAway: '3', period: 1, clock: 'PT10M00.00S', actionType: '3pt', description: 'Made' } as any,
  ];

  it('renders momentum graph text', () => {
    render(
      <MomentumGraph
        actions={mockActions}
        totalDuration={300}
        currentTime={60}
        onSeek={() => {}}
      />
    );
    expect(screen.getByText(/Momentum Graph/i)).toBeInTheDocument();
  });

  it('renders SVG elements', () => {
    const { container } = render(
      <MomentumGraph
        actions={mockActions}
        totalDuration={300}
        currentTime={60}
        onSeek={() => {}}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });
});
