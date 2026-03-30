import axios from 'axios';
import type { Course, CourseWork, StudentSubmission, AssignmentWithCourseInfo, CourseRole, Student, Teacher } from '../types/googleClassroom';

const API_BASE_URL = 'https://classroom.googleapis.com/v1';

interface GoogleApiConfig {
  headers: { Authorization: string };
  params?: any;
}

export const fetchCourseRoles = async (courseId: string, accessToken: string): Promise<CourseRole[]> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const roles: CourseRole[] = [];

  try {
    // Check if user is a teacher in this course
    await axios.get(`${API_BASE_URL}/courses/${courseId}/teachers/me`, config);
    roles.push("TEACHER");
  } catch (error) {
    // Not a teacher, ignore error
  }

  try {
    // Check if user is a student in this course
    await axios.get(`${API_BASE_URL}/courses/${courseId}/students/me`, config);
    roles.push("STUDENT");
  } catch (error) {
    // Not a student, ignore error
  }

  return roles;
};

export const fetchGlobalUserRoles = async (courses: Course[], accessToken: string): Promise<CourseRole[]> => {
  const globalRoles: Set<CourseRole> = new Set();

  for (const course of courses) {
    const rolesInCourse = await fetchCourseRoles(course.id, accessToken);
    rolesInCourse.forEach(role => globalRoles.add(role));
  }

  return Array.from(globalRoles);
};

export const fetchStudentsInCourse = async (courseId: string, accessToken: string): Promise<Student[]> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/students`, config);
  return response.data.students || [];
};

export const fetchTeachersInCourse = async (courseId: string, accessToken: string): Promise<Teacher[]> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/teachers`, config);
  return response.data.teachers || [];
};

export const fetchUserProfile = async (accessToken: string): Promise<any> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', config);
  return response.data;
};

export const fetchCourses = async (accessToken: string): Promise<Course[]> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const response = await axios.get(`${API_BASE_URL}/courses`, config);
  return response.data.courses || [];
};

export const fetchCourseWork = async (courseId: string, accessToken: string): Promise<CourseWork[]> => {
  const config: GoogleApiConfig = { 
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { courseWorkStates: 'PUBLISHED' }
  };
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/courseWork`, config);
  return response.data.courseWork || [];
};

export const fetchStudentSubmission = async (courseId: string, courseWorkId: string, accessToken: string): Promise<StudentSubmission | null> => {
  const config: GoogleApiConfig = { 
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { userId: 'me' }
  };
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`, config);
    return response.data.studentSubmissions?.[0] || null;
  } catch (error) {
    // Handle cases where no submission exists or API returns error for non-existent submission
    console.warn(`No submission found for course ${courseId}, coursework ${courseWorkId} or API error:`, error);
    return null;
  }
};

export const turnInAssignment = async (courseId: string, courseWorkId: string, submissionId: string, accessToken: string): Promise<void> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  await axios.post(`${API_BASE_URL}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:turnIn`, {}, config);
};

export const reclaimAssignment = async (courseId: string, courseWorkId: string, submissionId: string, accessToken: string): Promise<void> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  await axios.post(`${API_BASE_URL}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:reclaim`, {}, config);
};

export const createCourseWork = async (courseId: string, accessToken: string, courseWork: Partial<CourseWork>): Promise<CourseWork> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/courseWork`, courseWork, config);
  return response.data;
};

export const patchStudentSubmission = async (courseId: string, courseWorkId: string, submissionId: string, accessToken: string, assignedGrade: number): Promise<StudentSubmission> => {
  const config: GoogleApiConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
  const response = await axios.patch(`${API_BASE_URL}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}`, { assignedGrade }, config);
  return response.data;
};

export const fetchAllAssignmentsWithSubmissions = async (courses: Course[], accessToken: string): Promise<AssignmentWithCourseInfo[]> => {
  const assignmentsPromises = courses.map(async (course) => {
    try {
      const courseWork = await fetchCourseWork(course.id, accessToken);
      const worksWithSubmissions = await Promise.all(
        courseWork.map(async (work) => {
          const submission = await fetchStudentSubmission(course.id, work.id, accessToken);
          return {
            ...work,
            courseId: course.id,
            courseName: course.name,
            submission: submission,
          } as AssignmentWithCourseInfo;
        })
      );
      return worksWithSubmissions;
    } catch (error) {
      console.error(`Error fetching assignments for course ${course.name}:`, error);
      return [];
    }
  });

  const assignmentsResponses = await Promise.all(assignmentsPromises);
  return assignmentsResponses.flat();
};
