/**
 * AI-Based Trainer Recommendation System
 * Recommends trainers based on availability, expertise, HRDC status, past performance, and course type
 */

import prisma from '../../config/database';
import { calculateTrainerRating } from './ratingCalculator';

interface RecommendationCriteria {
  courseType?: string;
  category?: string;
  preferredDate?: Date;
  endDate?: Date;
  location?: string;
  minRating?: number;
}

interface TrainerRecommendation {
  trainer: any;
  score: number;
  reasons: string[];
}

export async function recommendTrainers(criteria: RecommendationCriteria): Promise<TrainerRecommendation[]> {
  try {
    const {
      // category,
      preferredDate,
      endDate,
      location,
      minRating = 0,
    } = criteria;

    // Get all active trainers
    let trainers = await prisma.trainer.findMany({
      include: {
        qualifications: true,
        trainerDocuments: {
          where: {
            documentType: { contains: 'HRDC' },
            verified: true,
          },
        },
        blockedDates: {
          where: preferredDate
            ? {
                blockedDate: {
                  gte: preferredDate,
                  lte: endDate || preferredDate,
                },
              }
            : undefined,
        },
        weeklyAvailability: true,
      },
    });

    // Filter and score trainers
    const recommendations: TrainerRecommendation[] = [];

    for (const trainer of trainers) {
      let score = 0;
      const reasons: string[] = [];

      // 1. HRDC Status (30 points)
      const hasValidHRDC =
        trainer.hrdcAccreditationId &&
        trainer.hrdcAccreditationValidUntil &&
        trainer.hrdcAccreditationValidUntil >= new Date();
      if (hasValidHRDC) {
        score += 30;
        reasons.push('Valid HRDC certification');
      } else {
        reasons.push('No valid HRDC certification');
      }

      // 2. Availability (25 points)
      if (preferredDate) {
        const isBlocked = trainer.blockedDates && trainer.blockedDates.length > 0;
        const hasWeeklyAvailability = trainer.weeklyAvailability && trainer.weeklyAvailability.length > 0;

        if (!isBlocked && hasWeeklyAvailability) {
          score += 25;
          reasons.push('Available on requested date');
        } else if (isBlocked) {
          reasons.push('Blocked on requested date');
        } else {
          score += 10;
          reasons.push('Limited availability');
        }
      } else {
        score += 15; // Partial points if no date specified
      }

      // 3. Expertise Match (20 points) - Temporarily disabled due to schema cleanup
      // To be replaced with new expertise table matching
      score += 10; 
      reasons.push('Expertise matching temporarily unavailable');


      // 4. Past Performance (15 points)
      const rating = await calculateTrainerRating(trainer.id);
      if (rating !== null && rating >= minRating) {
        if (rating >= 4.5) {
          score += 15;
          reasons.push(`Excellent rating: ${rating.toFixed(1)}`);
        } else if (rating >= 4.0) {
          score += 12;
          reasons.push(`Good rating: ${rating.toFixed(1)}`);
        } else if (rating >= 3.5) {
          score += 8;
          reasons.push(`Average rating: ${rating.toFixed(1)}`);
        } else {
          reasons.push(`Low rating: ${rating.toFixed(1)}`);
        }
      } else {
        reasons.push(`Rating below minimum: ${rating !== null ? rating.toFixed(1) : 'N/A'}`);
      }

      // 5. Location Match (10 points)
      if (location) {
        if (trainer.state?.toLowerCase() === location.toLowerCase() || trainer.city?.toLowerCase() === location.toLowerCase()) {
          score += 10;
          reasons.push(`Location match: ${location}`);
        } else {
          reasons.push(`Location mismatch`);
        }
      } else {
        score += 5; // Partial points if no location specified
      }

      // Only include trainers that meet minimum requirements
      if (hasValidHRDC && score >= 50) {
        recommendations.push({
          trainer: {
            ...trainer,
            rating,
          },
          score,
          reasons,
        });
      }
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  } catch (error: any) {
    console.error('Trainer recommendation error:', error);
    throw error;
  }
}

