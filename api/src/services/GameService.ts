import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Game, Player, GameStatus, CreateGameDTO, PlayerProgressDTO } from '../types/game';

export class GameService {
  private readonly redis: Redis;
  private readonly gamePrefix = 'game:';

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  private getGameKey(gameId: string): string {
    return `${this.gamePrefix}${gameId}`;
  }

  async createGame(dto: CreateGameDTO): Promise<Game> {
    const game: Game = {
      id: uuidv4(),
      status: GameStatus.WAITING,
      text: dto.text,
      players: [],
      maxPlayers: dto.maxPlayers,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.redis.set(
      this.getGameKey(game.id),
      JSON.stringify(game)
    );

    return game;
  }

  async getGame(gameId: string): Promise<Game | null> {
    const gameData = await this.redis.get(this.getGameKey(gameId));
    return gameData ? JSON.parse(gameData) : null;
  }

  async addPlayer(gameId: string, username: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new Error('Cannot join game - game is not in waiting state');
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error('Game is full');
    }

    const newPlayer: Player = {
      id: uuidv4(),
      username,
      currentPosition: 0,
      wpm: 0,
      accuracy: 100,
      isReady: false
    };

    game.players.push(newPlayer);
    game.updatedAt = new Date();

    await this.redis.set(
      this.getGameKey(game.id),
      JSON.stringify(game)
    );

    return game;
  }

  async updatePlayerProgress(dto: PlayerProgressDTO): Promise<Game> {
    const game = await this.getGame(dto.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== GameStatus.ACTIVE) {
      throw new Error('Game is not active');
    }

    const player = game.players.find(p => p.id === dto.playerId);
    if (!player) {
      throw new Error('Player not found in game');
    }

    player.currentPosition = dto.currentPosition;
    player.wpm = dto.wpm;
    player.accuracy = dto.accuracy;

    // Check if player has completed the text
    if (player.currentPosition >= game.text.length) {
      player.completedAt = new Date();
    }

    // Check if all players have completed
    const allCompleted = game.players.every(p => p.completedAt);
    if (allCompleted) {
      game.status = GameStatus.FINISHED;
      game.endTime = new Date();
    }

    game.updatedAt = new Date();

    await this.redis.set(
      this.getGameKey(game.id),
      JSON.stringify(game)
    );

    return game;
  }

  async setPlayerReady(gameId: string, playerId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found in game');
    }

    player.isReady = true;
    game.updatedAt = new Date();

    // Check if all players are ready
    const allReady = game.players.length >= 2 && game.players.every(p => p.isReady);
    if (allReady) {
      game.status = GameStatus.STARTING;
      // Game will transition to ACTIVE state through a separate countdown mechanism
    }

    await this.redis.set(
      this.getGameKey(game.id),
      JSON.stringify(game)
    );

    return game;
  }

  async startGame(gameId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== GameStatus.STARTING) {
      throw new Error('Game is not in starting state');
    }

    game.status = GameStatus.ACTIVE;
    game.startTime = new Date();
    game.updatedAt = new Date();

    await this.redis.set(
      this.getGameKey(game.id),
      JSON.stringify(game)
    );

    return game;
  }
}
