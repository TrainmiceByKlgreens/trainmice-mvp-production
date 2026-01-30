/**
 * Brochure Generator for Courses
 * Generates a multi-page PDF brochure for courses
 */

import jsPDF from 'jspdf';

interface CourseData {
  title: string;
  courseType?: string;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  description?: string | null;
  learningObjectives?: string[] | null;
  learningOutcomes?: string[] | null;
  targetAudience?: string | null;
  methodology?: string | null;
  hrdcClaimable?: boolean;
  schedule?: Array<{
    dayNumber: number;
    startTime: string;
    endTime: string;
    moduleTitle: string; // Now a string (one module per row)
    submoduleTitle?: string[] | null; // JSON array of submodules
  }>;
  // Trainer details (brochure-only, does NOT change database)
  trainerCustomId?: string | null;
  trainerProfessionalBio?: string | null;
  trainerEducation?: string[] | null;
  trainerWorkHistory?: string[] | null;
  trainerQualifications?: string[] | null;
  trainerLanguages?: Array<string> | null;
}

export const generateCourseBrochure = async (course: CourseData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  const maxY = pageHeight - margin;

  // Cache for the second page background image
  let secondPageBgImage: string | null = null;
  let secondPageBgLoaded = false;

  // Helper function to load second page background image
  const loadSecondPageBackground = async (): Promise<string | null> => {
    if (secondPageBgLoaded) {
      return secondPageBgImage;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/jpeg');
            secondPageBgImage = imgData;
            secondPageBgLoaded = true;
            resolve(imgData);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Error processing second page background:', error);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error('Error loading second page background image');
        secondPageBgLoaded = true; // Mark as loaded to prevent retries
        resolve(null);
      };
      
      img.src = '/Brochure2ndpage.jpeg';
    });
  };

  // Helper function to apply second page background to a new page
  const applySecondPageBackground = async () => {
    const bgImage = await loadSecondPageBackground();
    if (bgImage) {
      doc.addImage(bgImage, 'JPEG', 0, 0, pageWidth, pageHeight);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }
  };

  // Helper function to check if we need a new page
  const checkPageBreak = async (currentY: number, spaceNeeded: number = 20): Promise<number> => {
    if (currentY + spaceNeeded > maxY) {
      doc.addPage();
      await applySecondPageBackground();
      return margin;
    }
    return currentY;
  };

  // Helper function to add text with word wrap and page breaks
  const addText = async (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 10,
    fontStyle: string = 'normal',
    lineHeight: number = 1.5
  ): Promise<number> => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineSpacing = fontSize * 0.35 * lineHeight;
    
    let currentY = y;
    for (let i = 0; i < lines.length; i++) {
      currentY = await checkPageBreak(currentY, lineSpacing);
      doc.text(lines[i], x, currentY);
      currentY += lineSpacing;
    }
    
    return currentY;
  };

  // ============================================================================
  // PAGE 1: COVER PAGE WITH BACKGROUND IMAGE
  // ============================================================================
  
  // Load and add background image
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/jpeg');
            doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
            resolve(true);
          } else {
            throw new Error('Could not get canvas context');
          }
        } catch (error) {
          console.error('Error adding image to PDF:', error);
          doc.setFillColor(230, 240, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          resolve(false);
        }
      };
      img.onerror = () => {
        console.error('Error loading image');
        doc.setFillColor(230, 240, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        resolve(false);
      };
      img.src = '/BrochureFrontPage.jpeg';
    });
  } catch (error) {
    console.error('Error loading background image:', error);
    doc.setFillColor(230, 240, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  // Calculate date text
  let dateText = 'TBA';
  if (course.startDate) {
    const startDate = new Date(course.startDate);
    if (course.endDate && course.endDate !== course.startDate) {
      const endDate = new Date(course.endDate);
      dateText = `${startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      dateText = startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  // Course type mapping
  const courseTypeMap: { [key: string]: string } = {
    'IN_HOUSE': 'In-House',
    'PUBLIC': 'Public',
    'VIRTUAL': 'Virtual',
  };

  // Course title - lowered position
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const titleMaxWidth = contentWidth;
  const titleLines = doc.splitTextToSize(course.title, titleMaxWidth);
  const titleY = 80; // Lowered from 50 to 80
  
  // Center or left-align title
  titleLines.forEach((line: string, index: number) => {
    doc.text(line, margin, titleY + (index * 10));
  });

  // Course details below title
  let yPos = titleY + (titleLines.length * 10) + 25;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');

  // Training Mode
  doc.setFont('helvetica', 'bold');
  doc.text('Training Mode: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const modeText = courseTypeMap[course.courseType || 'IN_HOUSE'] || course.courseType || 'In-House';
  doc.text(modeText, margin + 50, yPos);
  yPos += 12;

  // Date - on front page
  doc.setFont('helvetica', 'bold');
  doc.text('Date: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const dateLines = doc.splitTextToSize(dateText, contentWidth - 50);
  dateLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 50, yPos + (index * 6));
  });
  yPos += Math.max(dateLines.length * 6, 12);

  // Venue - on front page
  doc.setFont('helvetica', 'bold');
  doc.text('Venue: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const venueText = course.venue || 'TBA';
  const venueLines = doc.splitTextToSize(venueText, contentWidth - 50);
  venueLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 50, yPos + (index * 6));
  });

  // Footer contact info
  doc.setFillColor(0, 51, 102, 0.9);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Phone: +6019 9331 008', margin, pageHeight - 12);
  doc.text('Email: enquiry@trainmice.com', pageWidth / 2 - 30, pageHeight - 12);
  doc.text('Website: www.trainmice.com', pageWidth - 70, pageHeight - 12);

  // ============================================================================
  // PAGE 2: COURSE DETAILS WITH BACKGROUND IMAGE
  // ============================================================================
  doc.addPage();
  await applySecondPageBackground();

  let currentY = margin;

  // Header
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COURSE INFORMATION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Course details without table
  doc.setTextColor(0, 0, 0);
  
  // Topic
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOPIC:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  currentY = await addText(course.title, margin, currentY, contentWidth, 10);
  currentY += 8;

  // Date
  currentY = await checkPageBreak(currentY, 15);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  currentY = await addText(dateText, margin, currentY, contentWidth, 10);
  currentY += 8;

  // Venue
  currentY = await checkPageBreak(currentY, 15);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VENUE:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  currentY = await addText(course.venue || 'TBA', margin, currentY, contentWidth, 10);
  currentY += 8;

  // Certificate (only if HRDC claimable)
  if (course.hrdcClaimable) {
    currentY = await checkPageBreak(currentY, 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE:', margin, currentY);
    currentY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    currentY = await addText('CERTIFICATE OF ATTENDANCE', margin, currentY, contentWidth, 10);
    currentY += 8;
  }

  currentY += 5;

  // Introduction
  currentY = await checkPageBreak(currentY, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Introduction:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (course.description) {
    currentY = await addText(course.description, margin, currentY, contentWidth, 10);
  } else {
    doc.text('N/A', margin, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Course Objectives
  currentY = await checkPageBreak(currentY, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Course Objectives:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (course.learningObjectives && course.learningObjectives.length > 0) {
    for (const obj of course.learningObjectives) {
      currentY = await checkPageBreak(currentY, 15);
      const bulletText = `• ${obj}`;
      currentY = await addText(bulletText, margin + 2, currentY, contentWidth - 2, 10);
      currentY += 2;
    }
  } else {
    doc.text('N/A', margin + 5, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Learning Outcomes
  currentY = await checkPageBreak(currentY, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Learning Outcomes:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (course.learningOutcomes && course.learningOutcomes.length > 0) {
    for (const outcome of course.learningOutcomes) {
      currentY = await checkPageBreak(currentY, 15);
      const bulletText = `• ${outcome}`;
      currentY = await addText(bulletText, margin + 2, currentY, contentWidth - 2, 10);
      currentY += 2;
    }
  } else {
    doc.text('N/A', margin + 5, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Target Audience
  currentY = await checkPageBreak(currentY, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Target Audience:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (course.targetAudience) {
    currentY = await addText(course.targetAudience, margin, currentY, contentWidth, 10);
  } else {
    doc.text('N/A', margin, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Methodology
  currentY = await checkPageBreak(currentY, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Methodology:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (course.methodology) {
    currentY = await addText(course.methodology, margin, currentY, contentWidth, 10);
  } else {
    doc.text('N/A', margin, currentY);
    currentY += 6;
  }

  // ============================================================================
  // COURSE SCHEDULE (with automatic page breaks, no table)
  // ============================================================================
  doc.addPage();
  await applySecondPageBackground();

  currentY = margin;

  // Header
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COURSE SCHEDULE', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  doc.setTextColor(0, 0, 0);

  if (course.schedule && course.schedule.length > 0) {
    // Group schedule by day, then by session (startTime, endTime)
    // New structure: one module per row, multiple modules can share same session
    const scheduleByDayAndSession: { [key: string]: typeof course.schedule } = {};
    course.schedule.forEach(item => {
      const key = `${item.dayNumber}-${item.startTime}-${item.endTime}`;
      if (!scheduleByDayAndSession[key]) {
        scheduleByDayAndSession[key] = [];
      }
      scheduleByDayAndSession[key].push(item);
    });

    // Group by day first
    const scheduleByDay: { [day: number]: { sessionKey: string; items: typeof course.schedule }[] } = {};
    Object.keys(scheduleByDayAndSession).forEach(sessionKey => {
      const items = scheduleByDayAndSession[sessionKey];
      if (items.length > 0) {
        const day = items[0].dayNumber;
        if (!scheduleByDay[day]) {
          scheduleByDay[day] = [];
        }
        scheduleByDay[day].push({ sessionKey, items });
      }
    });

    // Display schedule by day
    const sortedDays = Object.keys(scheduleByDay).sort((a, b) => parseInt(a) - parseInt(b));
    for (const day of sortedDays) {
      const daySessions = scheduleByDay[parseInt(day)];
      
      // Day header
      currentY = await checkPageBreak(currentY, 30);
      doc.setFillColor(0, 51, 102);
      doc.roundedRect(margin, currentY, contentWidth, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Day ${day}`, margin + 5, currentY + 6);
      currentY += 12;
      doc.setTextColor(0, 0, 0);

      // Sort sessions by start time
      daySessions.sort((a, b) => {
        const timeA = a.items[0]?.startTime || '';
        const timeB = b.items[0]?.startTime || '';
        return timeA.localeCompare(timeB);
      });

      // Display each session
      for (const session of daySessions) {
        const firstItem = session.items[0];
        if (!firstItem) continue;

        // Check if we need space for this session
        currentY = await checkPageBreak(currentY, 25);

        // Session time header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${firstItem.startTime} - ${firstItem.endTime}`, margin, currentY);
        currentY += 6;

        // Display all modules for this session
        for (const item of session.items) {
          // Module title (now a string, not array)
          const moduleTitle =
            typeof item.moduleTitle === 'string'
            ? item.moduleTitle 
              : Array.isArray(item.moduleTitle)
                ? (item.moduleTitle as any[]).join(', ')
                : '';
          
          if (moduleTitle) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            currentY = await addText(moduleTitle, margin + 5, currentY, contentWidth - 5, 10, 'bold');
          }

          // Submodules (JSON array)
          if (item.submoduleTitle) {
            let submodules: string[] = [];
            if (Array.isArray(item.submoduleTitle)) {
              submodules = item.submoduleTitle;
            } else if (typeof item.submoduleTitle === 'string') {
              submodules = [item.submoduleTitle];
            }

            if (submodules.length > 0) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              for (const submodule of submodules) {
                if (submodule && submodule.trim()) {
                  currentY = await addText(`• ${submodule}`, margin + 10, currentY, contentWidth - 10, 9);
                }
              }
            }
          }

          currentY += 4; // Space between modules
        }

        currentY += 8; // Space between sessions
      }

      currentY += 5; // Space between days
    }
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Schedule to be announced', pageWidth / 2, currentY + 20, { align: 'center' });
  }

  // ============================================================================
  // TRAINER PROFILE (separate page)
  // ============================================================================
  doc.addPage();
  await applySecondPageBackground();

  currentY = margin;

  doc.setTextColor(0, 51, 102);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAINER PROFILE', pageWidth / 2, currentY, { align: 'center' });
  currentY += 18;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);

  // Trainer ID
  if (course.trainerCustomId) {
    doc.setFont('helvetica', 'bold');
    doc.text('Trainer ID:', margin, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    currentY = await addText(course.trainerCustomId, margin, currentY, contentWidth, 10);
    currentY += 6;
  }

  // Professional Bio
  currentY = await checkPageBreak(currentY, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Professional Bio:', margin, currentY);
  currentY += 7;
  doc.setFont('helvetica', 'normal');
  if (course.trainerProfessionalBio) {
    currentY = await addText(course.trainerProfessionalBio, margin, currentY, contentWidth, 10);
  } else {
    doc.text('N/A', margin, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Education
  currentY = await checkPageBreak(currentY, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Education:', margin, currentY);
  currentY += 7;
  doc.setFont('helvetica', 'normal');
  if (course.trainerEducation && course.trainerEducation.length > 0) {
    for (const edu of course.trainerEducation) {
      currentY = await checkPageBreak(currentY, 12);
      currentY = await addText(`• ${edu}`, margin + 2, currentY, contentWidth - 2, 10);
      currentY += 2;
    }
  } else {
    doc.text('N/A', margin + 2, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Work History
  currentY = await checkPageBreak(currentY, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Work History:', margin, currentY);
  currentY += 7;
  doc.setFont('helvetica', 'normal');
  if (course.trainerWorkHistory && course.trainerWorkHistory.length > 0) {
    for (const work of course.trainerWorkHistory) {
      currentY = await checkPageBreak(currentY, 12);
      currentY = await addText(`• ${work}`, margin + 2, currentY, contentWidth - 2, 10);
      currentY += 2;
    }
  } else {
    doc.text('N/A', margin + 2, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Qualifications
  currentY = await checkPageBreak(currentY, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Qualifications & Certifications:', margin, currentY);
  currentY += 7;
  doc.setFont('helvetica', 'normal');
  if (course.trainerQualifications && course.trainerQualifications.length > 0) {
    for (const qual of course.trainerQualifications) {
      currentY = await checkPageBreak(currentY, 12);
      currentY = await addText(`• ${qual}`, margin + 2, currentY, contentWidth - 2, 10);
      currentY += 2;
    }
  } else {
    doc.text('N/A', margin + 2, currentY);
    currentY += 6;
  }
  currentY += 10;

  // Languages Spoken
  currentY = await checkPageBreak(currentY, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Languages Spoken:', margin, currentY);
  currentY += 7;
  doc.setFont('helvetica', 'normal');
  if (course.trainerLanguages && course.trainerLanguages.length > 0) {
    const languagesText = (course.trainerLanguages as any[]).join(', ');
    currentY = await addText(languagesText, margin, currentY, contentWidth, 10);
  } else {
    doc.text('N/A', margin, currentY);
    currentY += 6;
  }

  // Save the PDF
  const fileName = `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_brochure.pdf`;
  doc.save(fileName);
};