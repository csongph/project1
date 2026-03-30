import type { AssignmentWithCourseInfo, Notification } from '../types/googleClassroom';

export const isAssignmentOverdue = (assignment: AssignmentWithCourseInfo): boolean => {
  const now = new Date();
  
  if (!assignment.dueDate) return false;
  
  const isNotSubmitted = !assignment.submission || 
    assignment.submission.state === 'NEW' || 
    assignment.submission.state === 'RECLAIMED_BY_STUDENT';
  
  if (!isNotSubmitted) return false;
  
  const due = new Date(
    assignment.dueDate.year,
    assignment.dueDate.month - 1,
    assignment.dueDate.day,
    assignment.dueTime?.hours || 23,
    assignment.dueTime?.minutes || 59
  );
  
  return due < now;
};

export const isAssignmentSubmitted = (assignment: AssignmentWithCourseInfo): boolean => {
  return assignment.submission?.state === 'TURNED_IN' || assignment.submission?.state === 'RETURNED';
};

export const isAssignmentPending = (assignment: AssignmentWithCourseInfo): boolean => {
  return !assignment.submission || 
    assignment.submission.state === 'NEW' || 
    assignment.submission.state === 'RECLAIMED_BY_STUDENT';
};

export const formatDueDate = (assignment: AssignmentWithCourseInfo): string => {
  if (!assignment.dueDate) return 'ไม่มีกำหนดส่ง';
  
  const due = new Date(
    assignment.dueDate.year,
    assignment.dueDate.month - 1,
    assignment.dueDate.day,
    assignment.dueTime?.hours || 23,
    assignment.dueTime?.minutes || 59
  );
  
  return due.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short'
  });
};

export const formatDueDateWithTime = (assignment: AssignmentWithCourseInfo): string => {
  if (!assignment.dueDate) return 'ไม่มีกำหนดส่ง';
  
  const due = new Date(
    assignment.dueDate.year,
    assignment.dueDate.month - 1,
    assignment.dueDate.day,
    assignment.dueTime?.hours || 23,
    assignment.dueTime?.minutes || 59
  );
  
  return due.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const filterAssignmentsByStatus = (
  assignments: AssignmentWithCourseInfo[],
  status: 'all' | 'pending' | 'submitted' | 'overdue'
): AssignmentWithCourseInfo[] => {
  switch (status) {
    case 'pending':
      return assignments.filter(isAssignmentPending);
    case 'submitted':
      return assignments.filter(isAssignmentSubmitted);
    case 'overdue':
      return assignments.filter(a => isAssignmentOverdue(a) && isAssignmentPending(a));
    case 'all':
    default:
      return assignments;
  }
};

export const searchAssignments = (
  assignments: AssignmentWithCourseInfo[],
  query: string
): AssignmentWithCourseInfo[] => {
  const lowerQuery = query.toLowerCase();
  return assignments.filter(a => 
    a.title.toLowerCase().includes(lowerQuery) ||
    a.courseName.toLowerCase().includes(lowerQuery) ||
    (a.description?.toLowerCase().includes(lowerQuery) ?? false)
  );
};

export const sortAssignmentsByDueDate = (
  assignments: AssignmentWithCourseInfo[],
  order: 'asc' | 'desc' = 'asc'
): AssignmentWithCourseInfo[] => {
  return [...assignments].sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day).getTime() : Infinity;
    
    return order === 'asc' ? aDate - bDate : bDate - aDate;
  });
};


// ============ Notification Functions ============

export const getHoursUntilDeadline = (assignment: AssignmentWithCourseInfo): number => {
  if (!assignment.dueDate) return Infinity;
  
  const now = new Date();
  const due = new Date(
    assignment.dueDate.year,
    assignment.dueDate.month - 1,
    assignment.dueDate.day,
    assignment.dueTime?.hours || 23,
    assignment.dueTime?.minutes || 59
  );
  
  return (due.getTime() - now.getTime()) / (1000 * 60 * 60);
};

export const isDeadlineUrgent = (assignment: AssignmentWithCourseInfo): boolean => {
  const hoursLeft = getHoursUntilDeadline(assignment);
  return hoursLeft > 0 && hoursLeft <= 24 && isAssignmentPending(assignment);
};

export const isDeadlineWarning = (assignment: AssignmentWithCourseInfo): boolean => {
  const hoursLeft = getHoursUntilDeadline(assignment);
  return hoursLeft > 24 && hoursLeft <= 48 && isAssignmentPending(assignment);
};

export const getDeadlineNotifications = (
  assignments: AssignmentWithCourseInfo[]
): Notification[] => {
  const notifications: Notification[] = [];
  
  assignments.forEach((assignment) => {
    if (isDeadlineUrgent(assignment)) {
      const hoursLeft = Math.round(getHoursUntilDeadline(assignment));
      notifications.push({
        id: `urgent-${assignment.id}`,
        title: `⏰ งานเร่งด่วน: ${assignment.title}`,
        message: `${assignment.courseName} - เหลือเวลา ${hoursLeft} ชั่วโมง`,
        type: 'URGENT',
        timestamp: new Date().toISOString(),
        read: false,
        assignmentId: assignment.id,
        courseId: assignment.courseId
      });
    } else if (isDeadlineWarning(assignment)) {
      const hoursLeft = Math.round(getHoursUntilDeadline(assignment));
      notifications.push({
        id: `warning-${assignment.id}`,
        title: `⚠️ เตือน: ${assignment.title}`,
        message: `${assignment.courseName} - เหลือเวลา ${hoursLeft} ชั่วโมง`,
        type: 'WARNING',
        timestamp: new Date().toISOString(),
        read: false,
        assignmentId: assignment.id,
        courseId: assignment.courseId
      });
    }
  });
  
  return notifications;
};

export const getUrgentAssignments = (
  assignments: AssignmentWithCourseInfo[]
): AssignmentWithCourseInfo[] => {
  return assignments.filter(isDeadlineUrgent);
};
