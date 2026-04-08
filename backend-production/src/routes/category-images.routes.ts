import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { uploadCourseImage } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Get images for a specific category (Public)
router.get('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const images = await prisma.categoryImage.findMany({
            where: { category },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ images });
    } catch (error: any) {
        console.error('Get category images error:', error);
        return res.status(500).json({ error: 'Failed to fetch category images', details: error.message });
    }
});

// Admin routes
router.use(authenticate);

// Upload multiple images to a category (Admin)
router.post(
    '/',
    authorize('ADMIN'),
    uploadCourseImage.array('images', 10), // Allow up to 10 images at once
    async (req: AuthRequest, res: Response) => {
        try {
            const { category } = req.body;
            const files = req.files as Express.Multer.File[];

            if (!category) {
                // Cleanup uploaded files if category is missing
                if (files) {
                    files.forEach(file => fs.unlinkSync(file.path));
                }
                return res.status(400).json({ error: 'Category is required' });
            }

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'No images uploaded' });
            }

            const imageRecords = await Promise.all(
                files.map(async (file) => {
                    const imageUrl = `/uploads/course-images/${file.filename}`;
                    return prisma.categoryImage.create({
                        data: {
                            category,
                            imageUrl,
                        },
                    });
                })
            );

            return res.status(201).json({
                message: `${imageRecords.length} images uploaded successfully`,
                images: imageRecords
            });
        } catch (error: any) {
            console.error('Upload category images error:', error);
            // Cleanup files on error
            if (req.files) {
                (req.files as Express.Multer.File[]).forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            return res.status(500).json({ error: 'Failed to upload category images', details: error.message });
        }
    }
);

// Delete a category image (Admin)
router.delete(
    '/:id',
    authorize('ADMIN'),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const image = await prisma.categoryImage.findUnique({
                where: { id },
            });

            if (!image) {
                return res.status(404).json({ error: 'Image not found' });
            }

            // Delete file from filesystem
            const filePath = path.join(__dirname, '../../', image.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await prisma.categoryImage.delete({
                where: { id },
            });

            return res.json({ message: 'Category image deleted successfully' });
        } catch (error: any) {
            console.error('Delete category image error:', error);
            return res.status(500).json({ error: 'Failed to delete category image', details: error.message });
        }
    }
);

export default router;
