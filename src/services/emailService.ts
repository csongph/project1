import emailjs from '@emailjs/browser';
import type { AssignmentWithCourseInfo, Notification } from '../types/googleClassroom';
import { getDeadlineNotifications, getUrgentAssignments } from '../utils/assignmentUtils';

// Initialize EmailJS (You need to set these in .env file)
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_default';

// Initialize EmailJS once on app load
export const initializeEmailJS = () => {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized successfully');
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
  }
};

interface EmailParams extends Record<string, unknown> {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  assignment_list: string;
}

/**
 * Send email notification for urgent assignments
 */
export const sendDeadlineNotificationEmail = async (
  userEmail: string,
  userName: string,
  assignments: AssignmentWithCourseInfo[]
): Promise<boolean> => {
  try {
    const urgentAssignments = getUrgentAssignments(assignments);
    
    if (urgentAssignments.length === 0) {
      console.log('No urgent assignments to notify');
      return false;
    }

    // Format assignment list for email
    const assignmentList = urgentAssignments
      .map((a) => {
        const hoursLeft = Math.round(
          (new Date(
            a.dueDate!.year,
            a.dueDate!.month - 1,
            a.dueDate!.day,
            a.dueTime?.hours || 23,
            a.dueTime?.minutes || 59
          ).getTime() - new Date().getTime()) / (1000 * 60 * 60)
        );
        return `• ${a.title} (${a.courseName}) - เหลือ ${hoursLeft} ชั่วโมง`;
      })
      .join('\n');

    const emailParams: EmailParams = {
      to_email: userEmail,
      to_name: userName,
      subject: `⏰ การแจ้งเตือนงานเร่งด่วน - มี ${urgentAssignments.length} งานที่ใกล้ถึงกำหนด`,
      message: `สวัสดี ${userName},\n\nคุณมีงานที่เหลือเวลาไม่ถึง 24 ชั่วโมงดังต่อไปนี้:\n\n${assignmentList}\n\nกรุณาเข้าสู่ระบบ EduDash LMS เพื่อดูรายละเอียดเพิ่มเติมและส่งงานของคุณ\n\nขอบคุณ,\nทีม EduDash LMS`,
      assignment_list: assignmentList
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailParams
    );

    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
};

/**
 * Send a custom notification email
 */
export const sendCustomNotificationEmail = async (
  userEmail: string,
  userName: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const emailParams: EmailParams = {
      to_email: userEmail,
      to_name: userName,
      subject: subject,
      message: message,
      assignment_list: ''
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailParams
    );

    console.log('Custom email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Failed to send custom email:', error);
    return false;
  }
};

/**
 * Send summary email with all pending assignments
 */
export const sendAssignmentSummaryEmail = async (
  userEmail: string,
  userName: string,
  assignments: AssignmentWithCourseInfo[]
): Promise<boolean> => {
  try {
    const pendingAssignments = assignments.filter(a => 
      !a.submission || a.submission.state === 'NEW' || a.submission.state === 'RECLAIMED_BY_STUDENT'
    );

    if (pendingAssignments.length === 0) {
      console.log('No pending assignments to summarize');
      return false;
    }

    // Sort by due date
    const sortedAssignments = [...pendingAssignments].sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day).getTime() : Infinity;
      return aDate - bDate;
    });

    const assignmentList = sortedAssignments
      .map((a) => {
        const dueDate = a.dueDate 
          ? new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day).toLocaleDateString('th-TH')
          : 'ไม่มีกำหนด';
        return `• ${a.title} (${a.courseName}) - กำหนด: ${dueDate}`;
      })
      .join('\n');

    const emailParams: EmailParams = {
      to_email: userEmail,
      to_name: userName,
      subject: `📋 สรุปงานที่ค้างส่ง - ${pendingAssignments.length} งาน`,
      message: `สวัสดี ${userName},\n\nนี่คือสรุปงานที่คุณยังไม่ได้ส่ง:\n\n${assignmentList}\n\nกรุณาเข้าสู่ระบบ EduDash LMS เพื่อดูรายละเอียดเพิ่มเติมและส่งงานของคุณ\n\nขอบคุณ,\nทีม EduDash LMS`,
      assignment_list: assignmentList
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailParams
    );

    console.log('Summary email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Failed to send summary email:', error);
    return false;
  }
};

/**
 * Get notifications from assignments
 */
export const getNotificationsFromAssignments = (
  assignments: AssignmentWithCourseInfo[]
): Notification[] => {
  return getDeadlineNotifications(assignments);
};
