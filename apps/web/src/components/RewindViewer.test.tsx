import { render, screen, fireEvent } from '@testing-library/react';
import { RewindViewer } from './RewindViewer';
import { describe, it, expect, vi } from 'vitest';
import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';

// Mock hooks
vi.mock('@/hooks/useLiveGame', () => ({
  useLiveGame: ({ initialActions, initialBoxScore }: any) => ({
    actions: initialActions,
    boxScore: initialBoxScore,
    isLive: false,
    lastUpdated: null,
  }),
}));

vi.mock('@/hooks/usePlayback', () => ({
  usePlayback: ({ maxTime }: any) => ({
    isPlaying: false,
    currentTime: maxTime, // Show all actions by default
    playbackSpeed: 1,
    togglePlay: vi.fn(),
    seek: vi.fn(),
    setPlaybackSpeed: vi.fn(),
  }),
}));

// Mock MomentumGraph
vi.mock('./MomentumGraph', () => ({
  MomentumGraph: () => <div data-testid="momentum-graph" />,
}));

// Mock PlaybackControls
vi.mock('./PlaybackControls', () => ({
  PlaybackControls: () => <div data-testid="playback-controls" />,
}));

describe('RewindViewer Sorting', () => {
  const mockActions: PlayByPlayV3Action[] = [
    {
      actionNumber: 618,
      clock: 'PT05M20.00S',
      timeActual: '2024-01-01T00:00:00Z',
      period: 4,
      periodType: 'REGULAR',
      actionType: '2pt',
      subType: 'Layup',
      qualifiers: [],
      personId: 1,
      teamId: 1,
      teamTriplet: 'LAL',
      description: 'Layup Miss',
      scoreHome: '100',
      scoreAway: '100',
      pointsTotal: 0,
      location: 'h',
    },
    {
      actionNumber: 621,
      clock: 'PT05M18.00S',
      timeActual: '2024-01-01T00:00:03Z', // Happened later
      period: 4,
      periodType: 'REGULAR',
      actionType: 'rebound',
      subType: 'defensive',
      qualifiers: [],
      personId: 2,
      teamId: 2,
      teamTriplet: 'ATL',
      description: 'Rebound',
      scoreHome: '100',
      scoreAway: '100',
      pointsTotal: 0,
      location: 'a',
    },
    {
      actionNumber: 669, // Higher ID but happened in between
      clock: 'PT05M19.00S',
      timeActual: '2024-01-01T00:00:02Z', // Happened between 618 and 621
      period: 4,
      periodType: 'REGULAR',
      actionType: 'block',
      subType: '',
      qualifiers: [],
      personId: 3,
      teamId: 2,
      teamTriplet: 'ATL',
      description: 'Block',
      scoreHome: '100',
      scoreAway: '100',
      pointsTotal: 0,
      location: 'a',
    },
  ];

  it('sorts actions by time (period/clock) correctly, not just actionNumber', () => {
    render(<RewindViewer gameId="test" actions={mockActions} />);

    // Switch to PBP tab
    const pbpTab = screen.getByText('Play-by-Play');
    fireEvent.click(pbpTab);

    // The table shows actions in Reverse Chronological order (Newest first).
    // Chronological: 
    // 1. 618 (5:20)
    // 2. 669 (5:19)
    // 3. 621 (5:18)

    // Table (Reverse):
    // 1. 621 (5:18) - Rebound
    // 2. 669 (5:19) - Block
    // 3. 618 (5:20) - Layup Miss

    const rows = screen.getAllByRole('row');
    // Row 0 is header
    const firstRow = rows[1];
    const secondRow = rows[2];
    const thirdRow = rows[3];

    expect(firstRow).toHaveTextContent('5:18'); // Rebound
    expect(firstRow).toHaveTextContent('Rebound');

    expect(secondRow).toHaveTextContent('5:19'); // Block
    expect(secondRow).toHaveTextContent('Block');

    expect(thirdRow).toHaveTextContent('5:20'); // Layup Miss
    expect(thirdRow).toHaveTextContent('Layup Miss');
  });
});

describe('RewindViewer Logo Display', () => {
  it('renders team logos when boxScore is available', () => {
    const mockBoxScore = {
      homeTeam: { teamId: 1610612747, teamName: 'Lakers', teamTricode: 'LAL', players: [] },
      awayTeam: { teamId: 1610612737, teamName: 'Hawks', teamTricode: 'ATL', players: [] },
    };
    const mockActions: any[] = [{
      actionNumber: 1,
      clock: 'PT12M00.00S',
      timeActual: '2024-01-01T00:00:00Z',
      period: 1,
      scoreHome: '0',
      scoreAway: '0',
      teamId: 0,
    }];
    render(<RewindViewer gameId="test" actions={mockActions} initialData={mockBoxScore} />);

    const hawksLogo = screen.getByAltText('Hawks logo');
    const lakersLogo = screen.getByAltText('Lakers logo');

    expect(hawksLogo).toBeDefined();
    expect(lakersLogo).toBeDefined();

    // Check if src contains teamId (using find by name/selector as next/image might transform src)
    expect(hawksLogo.getAttribute('src')).toContain('1610612737');
    expect(lakersLogo.getAttribute('src')).toContain('1610612747');
  });

  it('does not render team logos when teamId is 0', () => {
    const mockBoxScore = {
      homeTeam: { teamId: 0, teamName: 'Lakers', teamTricode: 'LAL', players: [] },
      awayTeam: { teamId: 0, teamName: 'Hawks', teamTricode: 'ATL', players: [] },
    };
    render(<RewindViewer gameId="test" actions={[]} initialData={mockBoxScore} />);

    expect(screen.queryByAltText('Hawks logo')).toBeNull();
    expect(screen.queryByAltText('Lakers logo')).toBeNull();
  });
});