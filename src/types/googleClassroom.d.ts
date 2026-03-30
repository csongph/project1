export type CourseRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface Student {
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl: string;
  };
  courseId: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
}

export interface Teacher {
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl: string;
  };
  courseId: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
}

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface DueDate {
  year: number;
  month: number;
  day: number;
}

export interface DueTime {
  hours: number;
  minutes: number;
}

export interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseGroupEmail?: string;
  teacherGroupEmail?: string;
  alternateLink: string;
  teacherFolder?: {
    id: string;
    title: string;
    alternateLink: string;
  };
  courseMaterialSets?: any[]; // Simplified for now
  guardiansEnabled: boolean;
  calendarId?: string;
}

export interface CourseWork {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  state: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink: string;
  creationTime: string;
  updateTime: string;
  dueDate?: DueDate;
  dueTime?: DueTime;
  maxPoints?: number;
  workType: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
  associatedWithDeveloper: boolean;
  assigneeMode: 'ALL_STUDENTS' | 'INDIVIDUAL_STUDENTS';
  creatorUserId: string;
  topicId?: string;
  materials?: any[]; // Simplified for now
  gradeCategory?: {
    id: string;
    name: string;
    weight: number;
  };
  scheduledTime?: string;
  submissionModificationMode: 'MODIFIABLE_UNTIL_TURNED_IN' | 'MODIFIABLE';
  individualStudentsOptions?: {
    studentIds: string[];
  };
  referencingResource?: {
    driveFile?: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl: string;
    };
    youtubeVideo?: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl: string;
    };
    link?: {
      url: string;
      title: string;
      thumbnailUrl: string;
    };
  };
}

export interface StudentSubmission {
  courseId: string;
  courseWorkId: string;
  id: string;
  userId: string;
  creationTime: string;
  updateTime: string;
  state: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  alternateLink: string;
  late: boolean;
  draft: boolean;
  assignedGrade?: number;
  maxPoints?: number;
  assignmentSubmission?: {
    attachments?: any[]; // Simplified for now
  };
  shortAnswerSubmission?: {
    answer: string;
  };
  multipleChoiceSubmission?: {
    answer: string;
  };
  associatedWithDeveloper: boolean;
}

export interface AssignmentWithCourseInfo extends CourseWork {
  courseName: string;
  submission: StudentSubmission | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'URGENT' | 'WARNING' | 'INFO';
  timestamp: string;
  read: boolean;
  assignmentId?: string;
  courseId?: string;
}
