import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from './GameCard';
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
  };

  it('renders team names and initial state', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    expect(screen.getByText('Golden State Warriors')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
    
    const homeScore = screen.getByTestId('home-score');
    expect(homeScore).toHaveClass('blur-md');
  });

  it('toggles score visibility when clicking the button', () => {
    render(<GameCard game={mockGame} />);
    
    const button = screen.getByRole('button', { name: 'Show Score' });
    fireEvent.click(button);
    
    expect(screen.getByText('Visible')).toBeInTheDocument();
    const homeScore = screen.getByTestId('home-score');
    expect(homeScore).not.toHaveClass('blur-md');
    
    fireEvent.click(screen.getByRole('button', { name: 'Hide Score' }));
    expect(homeScore).toHaveClass('blur-md');
  });

  it('links to the correct game page', () => {
    render(<GameCard game={mockGame} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/game/0022300001');
  });
});
