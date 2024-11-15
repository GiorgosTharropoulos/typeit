import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { Redis } from "ioredis";
import { GameService } from "./services/GameService";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

const redis = new Redis();
const gameService = new GameService(redis);

const createGameSchema = z.object({
  maxPlayers: z.number().min(2).max(4),
  text: z.string().min(1)
});

app.post('/games', zValidator('json', createGameSchema), async (c) => {
  const body = c.req.valid('json');
  
  try {
    const game = await gameService.createGame(body);
    return c.json(game, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create game' }, 500);
  }
});

app.get("/", (c) => c.text("Hello, World!"));

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

export { injectWebSocket, app };
