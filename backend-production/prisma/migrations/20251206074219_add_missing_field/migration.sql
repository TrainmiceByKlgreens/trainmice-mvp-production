-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NULL,
    `role` ENUM('CLIENT', 'TRAINER', 'ADMIN') NOT NULL DEFAULT 'CLIENT',
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `company_email` VARCHAR(191) NOT NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `contact_number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clients_company_email_key`(`company_email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainers` (
    `id` VARCHAR(191) NOT NULL,
    `custom_trainer_id` VARCHAR(191) NULL,
    `profile_pic` TEXT NULL,
    `ic_number` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `race` VARCHAR(191) NULL,
    `phone_number` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `hourly_rate` DECIMAL(10, 2) NULL,
    `hrdc_accreditation_id` VARCHAR(191) NULL,
    `hrdc_accreditation_valid_until` DATE NULL,
    `professional_bio` TEXT NULL,
    `state` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `areas_of_expertise` JSON NULL,
    `languages_spoken` JSON NULL,
    `qualification` JSON NULL,
    `workHistory` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trainers_custom_trainer_id_key`(`custom_trainer_id`),
    INDEX `trainers_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `admin_code` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_admin_code_key`(`admin_code`),
    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `course_code` VARCHAR(191) NULL,
    `trainer_id` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `learning_objectives` JSON NULL,
    `learning_outcomes` JSON NULL,
    `target_audience` TEXT NULL,
    `methodology` TEXT NULL,
    `prerequisite` TEXT NULL,
    `certificate` VARCHAR(191) NULL,
    `assessment` BOOLEAN NOT NULL DEFAULT false,
    `course_type` ENUM('IN_HOUSE', 'PUBLIC', 'VIRTUAL') NOT NULL,
    `duration_hours` INTEGER NOT NULL,
    `duration_unit` VARCHAR(191) NULL DEFAULT 'hours',
    `modules` JSON NULL,
    `venue` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NULL,
    `fixed_date` DATE NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `category` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `hrdc_claimable` BOOLEAN NOT NULL DEFAULT false,
    `brochure_url` TEXT NULL,
    `course_sequence` INTEGER NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_by_admin` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `courses_course_code_key`(`course_code`),
    INDEX `courses_trainer_id_idx`(`trainer_id`),
    INDEX `courses_status_idx`(`status`),
    INDEX `courses_course_type_idx`(`course_type`),
    INDEX `courses_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_materials` (
    `id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `file_url` TEXT NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_materials_course_id_idx`(`course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_schedule` (
    `id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `day_number` INTEGER NOT NULL,
    `start_time` VARCHAR(191) NOT NULL,
    `end_time` VARCHAR(191) NOT NULL,
    `module_title` VARCHAR(191) NOT NULL,
    `submoduleTitle` VARCHAR(191) NULL,
    `duration_minutes` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_schedule_course_id_idx`(`course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_requests` (
    `id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NULL,
    `trainer_id` VARCHAR(191) NULL,
    `client_id` VARCHAR(191) NULL,
    `request_type` ENUM('PUBLIC', 'INHOUSE') NULL,
    `client_name` VARCHAR(191) NULL,
    `client_email` VARCHAR(191) NULL,
    `requested_date` DATE NULL,
    `end_date` DATE NULL,
    `requestedTime` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DENIED', 'TENTATIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `location` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `booking_requests_trainer_id_idx`(`trainer_id`),
    INDEX `booking_requests_client_id_idx`(`client_id`),
    INDEX `booking_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_availability` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `slot` ENUM('FULL', 'SLOT1', 'SLOT2') NULL,
    `status` ENUM('AVAILABLE', 'TENTATIVE', 'BOOKED', 'NOT_AVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    `startTime` VARCHAR(191) NULL,
    `endTime` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trainer_availability_trainer_id_idx`(`trainer_id`),
    INDEX `trainer_availability_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_blocked_days` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `day_of_week` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trainer_blocked_days_trainer_id_idx`(`trainer_id`),
    UNIQUE INDEX `trainer_blocked_days_trainer_id_day_of_week_key`(`trainer_id`, `day_of_week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_weekly_availability` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `day_of_week` INTEGER NOT NULL,
    `start_time` VARCHAR(191) NOT NULL,
    `end_time` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trainer_weekly_availability_trainer_id_idx`(`trainer_id`),
    UNIQUE INDEX `trainer_weekly_availability_trainer_id_day_of_week_key`(`trainer_id`, `day_of_week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_blocked_dates` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `blocked_date` DATE NOT NULL,
    `reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trainer_blocked_dates_trainer_id_idx`(`trainer_id`),
    INDEX `trainer_blocked_dates_blocked_date_idx`(`blocked_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'SUCCESS', 'ERROR') NOT NULL DEFAULT 'INFO',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `relatedEntityType` VARCHAR(191) NULL,
    `relatedEntityId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_documents` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `file_size` INTEGER NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploaded_by` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `expiresAt` DATE NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trainer_documents_trainer_id_idx`(`trainer_id`),
    INDEX `trainer_documents_course_id_idx`(`course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `review` VARCHAR(191) NULL,
    `reviewerName` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_reviews_trainerId_idx`(`trainerId`),
    INDEX `course_reviews_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualifications` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `year_obtained` INTEGER NULL,
    `qualification_type` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `qualifications_trainerId_idx`(`trainerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_history` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `work_history_trainerId_idx`(`trainerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `past_clients` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NOT NULL,
    `client_name` VARCHAR(191) NOT NULL,
    `project_description` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `past_clients_trainerId_idx`(`trainerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_course_requests` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `course_name` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NULL,
    `company_name` VARCHAR(191) NULL,
    `contact_person` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `client_phone` VARCHAR(191) NULL,
    `preferred_dates` TEXT NULL,
    `budget` DECIMAL(10, 2) NULL,
    `preferredMode` ENUM('ONLINE', 'IN_PERSON', 'HYBRID', 'IN_HOUSE', 'PUBLIC', 'VIRTUAL') NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS') NOT NULL DEFAULT 'PENDING',
    `assignedTrainerId` VARCHAR(191) NULL,
    `adminNotes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `custom_course_requests_clientId_idx`(`clientId`),
    INDEX `custom_course_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_submissions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NULL,
    `trainer_name` VARCHAR(191) NULL,
    `course_id` VARCHAR(191) NULL,
    `course_name` VARCHAR(191) NULL,
    `course_date` DATE NULL,
    `participant_name` VARCHAR(191) NULL,
    `attendance_duration` VARCHAR(191) NULL,
    `q_content_clarity` INTEGER NULL,
    `q_objectives_achieved` INTEGER NULL,
    `q_materials_helpful` INTEGER NULL,
    `q_environment_learning` INTEGER NULL,
    `q_trainer_knowledge` INTEGER NULL,
    `q_engagement` INTEGER NULL,
    `q_new_knowledge` INTEGER NULL,
    `q_application_understanding` INTEGER NULL,
    `q_recommend_course` INTEGER NULL,
    `positive_feedback` TEXT NULL,
    `improvement_feedback` TEXT NULL,
    `referrals` TEXT NULL,
    `requested_topics` TEXT NULL,
    `team_building_interest` TEXT NULL,
    `additional_comments` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedbacks_trainer_id_idx`(`trainer_id`),
    INDEX `feedbacks_course_id_idx`(`course_id`),
    INDEX `feedbacks_course_date_idx`(`course_date`),
    INDEX `feedbacks_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_trainers` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_trainers_courseId_idx`(`courseId`),
    INDEX `course_trainers_trainerId_idx`(`trainerId`),
    UNIQUE INDEX `course_trainers_courseId_trainerId_key`(`courseId`, `trainerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `booking_date` DATE NOT NULL,
    `startTime` VARCHAR(191) NULL,
    `endTime` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `final_confirmation` BOOLEAN NOT NULL DEFAULT false,
    `confirmedAt` DATETIME(3) NULL,
    `confirmedBy` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trainer_bookings_trainerId_idx`(`trainerId`),
    INDEX `trainer_bookings_booking_date_idx`(`booking_date`),
    INDEX `trainer_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_courses_conducted` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NULL,
    `course_name` VARCHAR(191) NOT NULL,
    `date_conducted` DATE NOT NULL,
    `location` VARCHAR(191) NULL,
    `participants_count` INTEGER NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trainer_courses_conducted_trainer_id_idx`(`trainer_id`),
    INDEX `trainer_courses_conducted_course_id_idx`(`course_id`),
    INDEX `trainer_courses_conducted_date_conducted_idx`(`date_conducted`),
    UNIQUE INDEX `trainer_courses_conducted_trainer_id_course_id_date_conducte_key`(`trainer_id`, `course_id`, `date_conducted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action_type` ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'CONFIRM', 'CANCEL') NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_userId_idx`(`userId`),
    INDEX `activity_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainer_messages` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `last_message` VARCHAR(191) NOT NULL DEFAULT 'No messages yet',
    `last_message_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `platform` ENUM('WEBSITE', 'WHATSAPP', 'EMAIL') NOT NULL DEFAULT 'WEBSITE',
    `is_read` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trainer_messages_trainer_id_key`(`trainer_id`),
    INDEX `trainer_messages_trainer_id_idx`(`trainer_id`),
    INDEX `trainer_messages_last_message_time_idx`(`last_message_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_id_fkey` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainers` ADD CONSTRAINT `trainers_id_fkey` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_id_fkey` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_materials` ADD CONSTRAINT `course_materials_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_schedule` ADD CONSTRAINT `course_schedule_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_requests` ADD CONSTRAINT `booking_requests_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_requests` ADD CONSTRAINT `booking_requests_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_requests` ADD CONSTRAINT `booking_requests_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_availability` ADD CONSTRAINT `trainer_availability_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_blocked_days` ADD CONSTRAINT `trainer_blocked_days_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_weekly_availability` ADD CONSTRAINT `trainer_weekly_availability_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_blocked_dates` ADD CONSTRAINT `trainer_blocked_dates_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_documents` ADD CONSTRAINT `trainer_documents_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_documents` ADD CONSTRAINT `trainer_documents_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_documents` ADD CONSTRAINT `trainer_documents_verifiedBy_fkey` FOREIGN KEY (`verifiedBy`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_documents` ADD CONSTRAINT `trainer_documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_reviews` ADD CONSTRAINT `course_reviews_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_reviews` ADD CONSTRAINT `course_reviews_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualifications` ADD CONSTRAINT `qualifications_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_history` ADD CONSTRAINT `work_history_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `past_clients` ADD CONSTRAINT `past_clients_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_course_requests` ADD CONSTRAINT `custom_course_requests_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_trainers` ADD CONSTRAINT `course_trainers_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_trainers` ADD CONSTRAINT `course_trainers_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_bookings` ADD CONSTRAINT `trainer_bookings_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_bookings` ADD CONSTRAINT `trainer_bookings_confirmedBy_fkey` FOREIGN KEY (`confirmedBy`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_courses_conducted` ADD CONSTRAINT `trainer_courses_conducted_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_courses_conducted` ADD CONSTRAINT `trainer_courses_conducted_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainer_messages` ADD CONSTRAINT `trainer_messages_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
