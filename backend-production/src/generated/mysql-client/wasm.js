
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  fullName: 'fullName',
  role: 'role',
  emailVerified: 'emailVerified',
  verificationToken: 'verificationToken',
  tokenExpiry: 'tokenExpiry',
  passwordResetToken: 'passwordResetToken',
  passwordResetExpiry: 'passwordResetExpiry',
  fcmToken: 'fcmToken',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientScalarFieldEnum = {
  id: 'id',
  companyEmail: 'companyEmail',
  userName: 'userName',
  contactNumber: 'contactNumber',
  companyName: 'companyName',
  companyAddress: 'companyAddress',
  city: 'city',
  state: 'state',
  position: 'position',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerScalarFieldEnum = {
  id: 'id',
  customTrainerId: 'customTrainerId',
  profilePic: 'profilePic',
  icNumber: 'icNumber',
  fullName: 'fullName',
  race: 'race',
  phoneNumber: 'phoneNumber',
  email: 'email',
  hourlyRate: 'hourlyRate',
  hrdcAccreditationId: 'hrdcAccreditationId',
  hrdcAccreditationValidUntil: 'hrdcAccreditationValidUntil',
  professionalBio: 'professionalBio',
  state: 'state',
  city: 'city',
  country: 'country',
  areasOfExpertise: 'areasOfExpertise',
  languagesSpoken: 'languagesSpoken',
  qualification: 'qualification',
  workHistory: 'workHistory',
  createdAt: 'createdAt'
};

exports.Prisma.AdminScalarFieldEnum = {
  id: 'id',
  adminCode: 'adminCode',
  email: 'email',
  fullName: 'fullName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  courseCode: 'courseCode',
  trainerId: 'trainerId',
  createdBy: 'createdBy',
  title: 'title',
  description: 'description',
  learningObjectives: 'learningObjectives',
  learningOutcomes: 'learningOutcomes',
  targetAudience: 'targetAudience',
  methodology: 'methodology',
  prerequisite: 'prerequisite',
  certificate: 'certificate',
  professionalDevelopmentPoints: 'professionalDevelopmentPoints',
  professionalDevelopmentPointsOther: 'professionalDevelopmentPointsOther',
  assessment: 'assessment',
  courseType: 'courseType',
  courseMode: 'courseMode',
  durationHours: 'durationHours',
  durationUnit: 'durationUnit',
  modules: 'modules',
  venue: 'venue',
  price: 'price',
  fixedDate: 'fixedDate',
  startDate: 'startDate',
  endDate: 'endDate',
  category: 'category',
  city: 'city',
  state: 'state',
  hrdcClaimable: 'hrdcClaimable',
  brochureUrl: 'brochureUrl',
  courseSequence: 'courseSequence',
  status: 'status',
  createdByAdmin: 'createdByAdmin',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseMaterialScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  fileUrl: 'fileUrl',
  fileName: 'fileName',
  uploadedAt: 'uploadedAt'
};

exports.Prisma.CourseScheduleScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  dayNumber: 'dayNumber',
  startTime: 'startTime',
  endTime: 'endTime',
  moduleTitle: 'moduleTitle',
  submoduleTitle: 'submoduleTitle',
  durationMinutes: 'durationMinutes',
  createdAt: 'createdAt'
};

exports.Prisma.BookingRequestScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  trainerId: 'trainerId',
  clientId: 'clientId',
  requestType: 'requestType',
  clientName: 'clientName',
  clientEmail: 'clientEmail',
  requestedDate: 'requestedDate',
  endDate: 'endDate',
  requestedTime: 'requestedTime',
  trainerAvailabilityId: 'trainerAvailabilityId',
  status: 'status',
  location: 'location',
  city: 'city',
  state: 'state',
  createdAt: 'createdAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  eventCode: 'eventCode',
  trainerId: 'trainerId',
  createdBy: 'createdBy',
  title: 'title',
  description: 'description',
  learningObjectives: 'learningObjectives',
  learningOutcomes: 'learningOutcomes',
  targetAudience: 'targetAudience',
  methodology: 'methodology',
  prerequisite: 'prerequisite',
  certificate: 'certificate',
  professionalDevelopmentPoints: 'professionalDevelopmentPoints',
  professionalDevelopmentPointsOther: 'professionalDevelopmentPointsOther',
  assessment: 'assessment',
  courseType: 'courseType',
  courseMode: 'courseMode',
  durationHours: 'durationHours',
  durationUnit: 'durationUnit',
  modules: 'modules',
  venue: 'venue',
  price: 'price',
  eventDate: 'eventDate',
  startDate: 'startDate',
  endDate: 'endDate',
  category: 'category',
  city: 'city',
  state: 'state',
  hrdcClaimable: 'hrdcClaimable',
  brochureUrl: 'brochureUrl',
  courseSequence: 'courseSequence',
  status: 'status',
  maxPacks: 'maxPacks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventRegistrationScalarFieldEnum = {
  id: 'id',
  eventId: 'eventId',
  clientId: 'clientId',
  clientName: 'clientName',
  clientEmail: 'clientEmail',
  clientsReferenceId: 'clientsReferenceId',
  packNumber: 'packNumber',
  numberOfParticipants: 'numberOfParticipants',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientsReferenceScalarFieldEnum = {
  id: 'id',
  companyName: 'companyName',
  address: 'address',
  state: 'state',
  city: 'city',
  picName: 'picName',
  email: 'email',
  contactNumber: 'contactNumber',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerAvailabilityScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  date: 'date',
  slot: 'slot',
  status: 'status',
  startTime: 'startTime',
  endTime: 'endTime',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerBlockedDayScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  dayOfWeek: 'dayOfWeek',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerWeeklyAvailabilityScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  dayOfWeek: 'dayOfWeek',
  startTime: 'startTime',
  endTime: 'endTime',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerBlockedDateScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  blockedDate: 'blockedDate',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  relatedEntityType: 'relatedEntityType',
  relatedEntityId: 'relatedEntityId',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerDocumentScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  courseId: 'courseId',
  documentType: 'documentType',
  fileUrl: 'fileUrl',
  fileName: 'fileName',
  fileSize: 'fileSize',
  uploadedAt: 'uploadedAt',
  uploadedBy: 'uploadedBy',
  verified: 'verified',
  verifiedBy: 'verifiedBy',
  verifiedAt: 'verifiedAt',
  expiresAt: 'expiresAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseReviewScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  courseId: 'courseId',
  rating: 'rating',
  review: 'review',
  reviewerName: 'reviewerName',
  createdAt: 'createdAt'
};

exports.Prisma.QualificationScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  title: 'title',
  institution: 'institution',
  yearObtained: 'yearObtained',
  qualificationType: 'qualificationType',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.WorkHistoryScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  company: 'company',
  position: 'position',
  startDate: 'startDate',
  endDate: 'endDate',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.PastClientScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  clientName: 'clientName',
  projectDescription: 'projectDescription',
  year: 'year',
  createdAt: 'createdAt'
};

exports.Prisma.CustomCourseRequestScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  courseName: 'courseName',
  reason: 'reason',
  industry: 'industry',
  companyName: 'companyName',
  contactPerson: 'contactPerson',
  email: 'email',
  clientPhone: 'clientPhone',
  preferredDates: 'preferredDates',
  budget: 'budget',
  preferredMode: 'preferredMode',
  status: 'status',
  assignedTrainerId: 'assignedTrainerId',
  adminNotes: 'adminNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactSubmissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  message: 'message',
  createdAt: 'createdAt'
};

exports.Prisma.FeedbackScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  courseId: 'courseId',
  courseName: 'courseName',
  courseDate: 'courseDate',
  courseDuration: 'courseDuration',
  attendance: 'attendance',
  participantName: 'participantName',
  contentClarity: 'contentClarity',
  objectivesAchieved: 'objectivesAchieved',
  materialsHelpful: 'materialsHelpful',
  learningEnvironment: 'learningEnvironment',
  trainerKnowledge: 'trainerKnowledge',
  trainerEngagement: 'trainerEngagement',
  knowledgeExposure: 'knowledgeExposure',
  knowledgeApplication: 'knowledgeApplication',
  durationSuitable: 'durationSuitable',
  recommendCourse: 'recommendCourse',
  likedMost: 'likedMost',
  improvementSuggestion: 'improvementSuggestion',
  additionalComments: 'additionalComments',
  recommendColleagues: 'recommendColleagues',
  referralDetails: 'referralDetails',
  futureTrainingTopics: 'futureTrainingTopics',
  inhouseTrainingNeeds: 'inhouseTrainingNeeds',
  teamBuildingInterest: 'teamBuildingInterest',
  eventId: 'eventId',
  createdAt: 'createdAt'
};

exports.Prisma.CourseTrainerScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  trainerId: 'trainerId',
  assignedAt: 'assignedAt'
};

exports.Prisma.TrainerBookingScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  courseId: 'courseId',
  bookingDate: 'bookingDate',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  finalConfirmation: 'finalConfirmation',
  confirmedAt: 'confirmedAt',
  confirmedBy: 'confirmedBy',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainerCourseConductedScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  courseId: 'courseId',
  courseName: 'courseName',
  dateConducted: 'dateConducted',
  location: 'location',
  participantsCount: 'participantsCount',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  actionType: 'actionType',
  entityType: 'entityType',
  entityId: 'entityId',
  description: 'description',
  metadata: 'metadata',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.MessageThreadScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  lastMessage: 'lastMessage',
  lastMessageTime: 'lastMessageTime',
  lastMessageBy: 'lastMessageBy',
  unreadCount: 'unreadCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  threadId: 'threadId',
  senderType: 'senderType',
  senderId: 'senderId',
  message: 'message',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerMessageScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  lastMessage: 'lastMessage',
  lastMessageTime: 'lastMessageTime',
  platform: 'platform',
  isRead: 'isRead',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventEnquiryScalarFieldEnum = {
  id: 'id',
  eventId: 'eventId',
  trainerId: 'trainerId',
  message: 'message',
  subject: 'subject',
  isRead: 'isRead',
  unreadCount: 'unreadCount',
  lastMessageTime: 'lastMessageTime',
  lastMessageBy: 'lastMessageBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventEnquiryMessageScalarFieldEnum = {
  id: 'id',
  enquiryId: 'enquiryId',
  senderType: 'senderType',
  senderId: 'senderId',
  message: 'message',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  CLIENT: 'CLIENT',
  TRAINER: 'TRAINER',
  ADMIN: 'ADMIN'
};

exports.CourseStatus = exports.$Enums.CourseStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED'
};

exports.BookingRequestType = exports.$Enums.BookingRequestType = {
  PUBLIC: 'PUBLIC',
  INHOUSE: 'INHOUSE'
};

exports.BookingStatus = exports.$Enums.BookingStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  TENTATIVE: 'TENTATIVE',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

exports.EventStatus = exports.$Enums.EventStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.TrainerAvailabilitySlot = exports.$Enums.TrainerAvailabilitySlot = {
  FULL: 'FULL',
  SLOT1: 'SLOT1',
  SLOT2: 'SLOT2'
};

exports.TrainerAvailabilityStatus = exports.$Enums.TrainerAvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  TENTATIVE: 'TENTATIVE',
  BOOKED: 'BOOKED',
  NOT_AVAILABLE: 'NOT_AVAILABLE'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

exports.CustomCoursePreferredMode = exports.$Enums.CustomCoursePreferredMode = {
  ONLINE: 'ONLINE',
  IN_PERSON: 'IN_PERSON',
  HYBRID: 'HYBRID',
  IN_HOUSE: 'IN_HOUSE',
  PUBLIC: 'PUBLIC',
  VIRTUAL: 'VIRTUAL'
};

exports.CustomCourseRequestStatus = exports.$Enums.CustomCourseRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS'
};

exports.TrainerBookingStatus = exports.$Enums.TrainerBookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

exports.ActivityType = exports.$Enums.ActivityType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  CONFIRM: 'CONFIRM',
  CANCEL: 'CANCEL'
};

exports.TrainerMessagePlatform = exports.$Enums.TrainerMessagePlatform = {
  WEBSITE: 'WEBSITE',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL'
};

exports.Prisma.ModelName = {
  User: 'User',
  Client: 'Client',
  Trainer: 'Trainer',
  Admin: 'Admin',
  Course: 'Course',
  CourseMaterial: 'CourseMaterial',
  CourseSchedule: 'CourseSchedule',
  BookingRequest: 'BookingRequest',
  Event: 'Event',
  EventRegistration: 'EventRegistration',
  ClientsReference: 'ClientsReference',
  TrainerAvailability: 'TrainerAvailability',
  TrainerBlockedDay: 'TrainerBlockedDay',
  TrainerWeeklyAvailability: 'TrainerWeeklyAvailability',
  TrainerBlockedDate: 'TrainerBlockedDate',
  Notification: 'Notification',
  TrainerDocument: 'TrainerDocument',
  CourseReview: 'CourseReview',
  Qualification: 'Qualification',
  WorkHistory: 'WorkHistory',
  PastClient: 'PastClient',
  CustomCourseRequest: 'CustomCourseRequest',
  ContactSubmission: 'ContactSubmission',
  Feedback: 'Feedback',
  CourseTrainer: 'CourseTrainer',
  TrainerBooking: 'TrainerBooking',
  TrainerCourseConducted: 'TrainerCourseConducted',
  ActivityLog: 'ActivityLog',
  MessageThread: 'MessageThread',
  Message: 'Message',
  TrainerMessage: 'TrainerMessage',
  EventEnquiry: 'EventEnquiry',
  EventEnquiryMessage: 'EventEnquiryMessage'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
