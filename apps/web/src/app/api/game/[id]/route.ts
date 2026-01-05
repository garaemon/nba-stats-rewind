import { NextRequest, NextResponse } from 'next/server';
import { getPlayByPlayV3, getBoxScoreV3 } from '@nba-stats-rewind/nba-api-client';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const gameId = params.id;

  try {
    const [actions, boxscore] = await Promise.all([
      getPlayByPlayV3(gameId),
      getBoxScoreV3(gameId),
    ]);

    return NextResponse.json({ actions, boxscore });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game data' },
      { status: 500 }
    );
  }
}
