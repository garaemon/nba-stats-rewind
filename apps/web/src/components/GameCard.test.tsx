import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from './GameCard';
import { TimezoneProvider } from './TimezoneProvider';
import { describe, it, expect, vi } from 'vitest';

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

describe('GameCard', () => {
  const mockGame = {
    gameId: '0022300001',
    gameDate: '2024-01-01',
    homeTeamId: 10,
    visitorTeamId: 20,
    homeTeamName: 'Los Angeles Lakers',
    visitorTeamName: 'Golden State Warriors',
    homeScore: 110,
    visitorScore: 105,
    gameStatusText: 'Final',
    gameStatus: 3,
  };

  const renderWithProvider = (component: React.ReactNode) => {
    return render(
      <TimezoneProvider>
        {component}
      </TimezoneProvider>
    );
  };

  it('renders team names and initial state', () => {
    renderWithProvider(<GameCard game={mockGame} />);
    
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    expect(screen.getByText('Golden State Warriors')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
    
    const homeScore = screen.getByTestId('home-score');
    expect(homeScore).toHaveClass('blur-md');
  });

  it('toggles score visibility when clicking the button', () => {
    renderWithProvider(<GameCard game={mockGame} />);
    
    const button = screen.getByRole('button', { name: 'Show Score' });
    fireEvent.click(button);
    
    expect(screen.getByText('Visible')).toBeInTheDocument();
    const homeScore = screen.getByTestId('home-score');
    expect(homeScore).not.toHaveClass('blur-md');
    
    fireEvent.click(screen.getByRole('button', { name: 'Hide Score' }));
    expect(homeScore).toHaveClass('blur-md');
  });

  it('links to the correct game page', () => {
    renderWithProvider(<GameCard game={mockGame} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/game/0022300001');
  });

  describe('Status Indicator', () => {
    const getIndicator = (statusText: string) => {
      const text = screen.getByText(statusText);
      return text.parentElement?.firstElementChild;
    };

    it('shows gray dot for Final games', () => {
      renderWithProvider(<GameCard game={{ ...mockGame, gameStatusText: 'Final', gameStatus: 3 }} />);
      const dot = getIndicator('Final');
      expect(dot).toHaveClass('bg-slate-300');
    });

    it('shows blue dot for Scheduled games (ET)', () => {
      renderWithProvider(<GameCard game={{ ...mockGame, gameStatusText: '7:00 pm ET', gameStatus: 1 }} />);
      const dot = getIndicator('7:00 pm ET');
      expect(dot).toHaveClass('bg-blue-500');
      expect(dot).not.toHaveClass('animate-pulse');
    });

    it('shows green pulsing dot for Live games', () => {
      renderWithProvider(<GameCard game={{ ...mockGame, gameStatusText: 'Q1 10:00', gameStatus: 2 }} />);
      const dot = getIndicator('Q1 10:00');
      expect(dot).toHaveClass('bg-green-500');
      expect(dot).toHaveClass('animate-pulse');
    });
  });
});
