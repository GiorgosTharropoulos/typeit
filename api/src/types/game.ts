export const GameStatus = {
  WAITING: 'waiting',     // Waiting for players to join
  STARTING: 'starting',   // Countdown before game starts
  ACTIVE: 'active',       // Game is in progress
  FINISHED: 'finished'    // Game has ended
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export interface Player {
  id: string;
  username: string;
  currentPosition: number;  // Current character position in the text
  wpm: number;             // Words per minute
  accuracy: number;        // Typing accuracy percentage
  isReady: boolean;        // Player ready status
  completedAt?: Date;      // When player finished typing
}

export interface Game {
  id: string;
  status: GameStatus;
  text: string;           // The text players need to type
  players: Player[];
  maxPlayers: number;
  startTime?: Date;       // When the game started
  endTime?: Date;         // When the game ended
  createdAt: Date;
  updatedAt: Date;
}

// For creating a new game
export interface CreateGameDTO {
  maxPlayers: number;
  text: string;
}

// For updating player progress
export interface PlayerProgressDTO {
  gameId: string;
  playerId: string;
  currentPosition: number;
  wpm: number;
  accuracy: number;
}
