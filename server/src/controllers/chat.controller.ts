import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { modelsService } from '../services/llm/models.service';
import { requireVisitorToken } from '../utils/visitorToken';
import { visitorFootprint } from '../utils/visitorFootprint';
import type { ChatMessageRequest, CreateSessionRequest } from '../validation/chat.schema';

export const getModels = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await modelsService.getAvailable());
  } catch (error) {
    next(error);
  }
};

export const handleChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId, model } = req.body as ChatMessageRequest;

    const { reply, modelUsed } = await chatService.processMessage({
      visitor: visitorFootprint(req),
      sessionId,
      message,
      model,
    });

    console.log(`🤖 [CHAT] session ${sessionId} answered by ${modelUsed}`);
    res.json({ reply, modelUsed });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { model, title } = req.body as CreateSessionRequest;

    res.status(201).json(await chatService.createSession(visitorFootprint(req), model, title));
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await chatService.listSessions(requireVisitorToken(req)));
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorToken = requireVisitorToken(req);
    const { id } = req.params as { id: string };

    res.json(await chatService.getHistory(visitorToken, id));
  } catch (error) {
    next(error);
  }
};
