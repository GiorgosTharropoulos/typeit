import { Redis } from "ioredis";
import invariant from "tiny-invariant";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GameStatus } from "../../types/game";
import { GameService } from "../GameService";

describe("GameService Integration Tests", () => {
  let redis: Redis;
  let gameService: GameService;

  beforeEach(() => {
    redis = new Redis(); // Connects to localhost:6379 by default
    gameService = new GameService(redis);
  });

  afterEach(async () => {
    // Clean up after each test
    const keys = await redis.keys("game:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.quit();
  });

  describe("createGame", () => {
    it("should create a new game with correct initial state", async () => {
      const gameData = {
        maxPlayers: 4,
        text: "Test typing text",
      };

      const game = await gameService.createGame(gameData);

      expect(game.id).toBeDefined();
      expect(game.status).toBe(GameStatus.WAITING);
      expect(game.text).toBe(gameData.text);
      expect(game.maxPlayers).toBe(gameData.maxPlayers);
      expect(game.players).toHaveLength(0);
      expect(game.createdAt).toBeInstanceOf(Date);
      expect(game.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("addPlayer", () => {
    it("should add a player to an existing game", async () => {
      const game = await gameService.createGame({
        maxPlayers: 4,
        text: "Test text",
      });

      const updatedGame = await gameService.addPlayer(game.id, "TestPlayer");

      expect(updatedGame.players).toHaveLength(1);
      expect(updatedGame.players[0]?.username).toBe("TestPlayer");
      expect(updatedGame.players[0]?.currentPosition).toBe(0);
      expect(updatedGame.players[0]?.wpm).toBe(0);
      expect(updatedGame.players[0]?.accuracy).toBe(100);
      expect(updatedGame.players[0]?.isReady).toBe(false);
    });

    it("should throw error when game is full", async () => {
      const game = await gameService.createGame({
        maxPlayers: 1,
        text: "Test text",
      });

      await gameService.addPlayer(game.id, "Player1");

      await expect(gameService.addPlayer(game.id, "Player2")).rejects.toThrow(
        "Game is full",
      );
    });
  });

  describe("setPlayerReady", () => {
    it("should set player ready status and update game status when all players ready", async () => {
      const game = await gameService.createGame({
        maxPlayers: 2,
        text: "Test text",
      });

      await gameService.addPlayer(game.id, "Player1");
      const gameWithPlayer2 = await gameService.addPlayer(game.id, "Player2");

      const player1Id = gameWithPlayer2.players[0]?.id;
      const player2Id = gameWithPlayer2.players[1]?.id;

      expect(player1Id).toBeDefined();
      expect(player2Id).toBeDefined();
      invariant(player1Id);
      invariant(player2Id);

      await gameService.setPlayerReady(game.id, player1Id);
      const finalGame = await gameService.setPlayerReady(game.id, player2Id);

      expect(finalGame.status).toBe(GameStatus.STARTING);
      expect(finalGame.players.every((p) => p.isReady)).toBe(true);
    });
  });

  describe("updatePlayerProgress", () => {
    it("should update player progress and finish game when all complete", async () => {
      const game = await gameService.createGame({
        maxPlayers: 2,
        text: "Test text",
      });

      const gameWithPlayer1 = await gameService.addPlayer(game.id, "Player1");
      const gameWithBothPlayers = await gameService.addPlayer(
        game.id,
        "Player2",
      );

      const player1Id = gameWithPlayer1.players[0]?.id;
      const player2Id = gameWithBothPlayers.players[1]?.id;

      expect(player1Id).toBeDefined();
      expect(player2Id).toBeDefined();
      invariant(player1Id);
      invariant(player2Id);

      await gameService.setPlayerReady(game.id, player1Id);
      await gameService.setPlayerReady(game.id, player2Id);
      await gameService.startGame(game.id);

      // Update progress for both players
      await gameService.updatePlayerProgress({
        gameId: game.id,
        playerId: player1Id,
        currentPosition: 9, // Length of 'Test text'
        wpm: 60,
        accuracy: 95,
      });

      const finalGame = await gameService.updatePlayerProgress({
        gameId: game.id,
        playerId: player2Id,
        currentPosition: 9,
        wpm: 55,
        accuracy: 90,
      });

      expect(finalGame.status).toBe(GameStatus.FINISHED);
      expect(finalGame.players[0]?.completedAt).toBeDefined();
      expect(finalGame.players[1]?.completedAt).toBeDefined();
      expect(finalGame.endTime).toBeDefined();
    });
  });
});
