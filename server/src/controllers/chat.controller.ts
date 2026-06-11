import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';

export const handleChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId, model } = req.body;

    if (!message || !sessionId || !model) {
      return res.status(400).json({ error: 'Message, sessionId, and model are required' });
    }

    const rawIp =
      req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    console.log(`💬 [CHAT] IP: ${ip} | User-Agent: ${userAgent} | Message: "${message}"`);

    const { reply, modelUsed } = await chatService.processMessage(message, sessionId, model, ip, userAgent);

    console.log(`🤖 [CHAT RESPONSE] IP: ${ip} | Model Used: ${modelUsed} | Reply: "${reply.slice(0, 100)}${reply.length > 100 ? '...' : ''}"`);

    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { model, title } = req.body;
    const session = await chatService.createSession(model, title);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await chatService.getSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const history = await chatService.getHistory(id as string);
    res.json(history);
  } catch (error) {
    next(error);
  }
};
