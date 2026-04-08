import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Submit contact form (public)
router.post(
  '/submit',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('message').notEmpty().trim(),
    body('phone').optional().trim(),
  ],
  async (req: express.Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, message, phone } = req.body;

      const submission = await prisma.contactSubmission.create({
        data: {
          name,
          email,
          message,
          phone,
        },
      });

      return res.status(201).json({
        message: 'Contact submission received successfully',
        submission: {
          id: submission.id,
          createdAt: submission.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Contact submission error:', error);
      return res.status(500).json({ error: 'Failed to submit contact form', details: error.message });
    }
  }
);

// Get all contact submissions (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ submissions });
  } catch (error: any) {
    console.error('Get contact submissions error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact submissions', details: error.message });
  }
});

export default router;

