import contactRoutes from './contact.routes';
import chatRoutes from './chat.routes';
import { Router } from 'express';

const router = Router();

router.use('/contact', contactRoutes);
router.use('/chat', chatRoutes);

export default router;
