/**
 * classroomTeacherService.ts
 * Google Classroom API calls for teacher role
 * Docs: https://developers.google.com/classroom/reference/rest
 */

import type { CourseWork, Student, StudentSubmission } from '../types/googleClassroom';

const BASE = 'https://classroom.googleapis.com/v1';

// ── Generic fetch helper ────────────────────────────────────────────
async function gFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Paginated fetch (handles nextPageToken) ─────────────────────────
async function gFetchAll<T>(
  buildUrl: (pageToken?: string) => string,
  token: string,
  listKey: string
): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;
  do {
    const data: any = await gFetch(buildUrl(pageToken), token);
    if (data[listKey]) items.push(...data[listKey]);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

// ── Fetch coursework for a course (teacher sees all) ────────────────
export async function fetchCourseWork(
  courseId: string,
  token: string
): Promise<CourseWork[]> {
  return gFetchAll<CourseWork>(
    (pt) =>
      `${BASE}/courses/${courseId}/courseWork?pageSize=50${pt ? `&pageToken=${pt}` : ''}`,
    token,
    'courseWork'
  );
}

// ── Fetch all students enrolled in a course ─────────────────────────
export async function fetchStudents(
  courseId: string,
  token: string
): Promise<Student[]> {
  return gFetchAll<Student>(
    (pt) =>
      `${BASE}/courses/${courseId}/students?pageSize=100${pt ? `&pageToken=${pt}` : ''}`,
    token,
    'students'
  );
}

// ── Fetch submissions for one piece of coursework (teacher view) ────
export async function fetchSubmissionsForWork(
  courseId: string,
  courseWorkId: string,
  token: string
): Promise<StudentSubmission[]> {
  return gFetchAll<StudentSubmission>(
    (pt) =>
      `${BASE}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions?pageSize=100${pt ? `&pageToken=${pt}` : ''}`,
    token,
    'studentSubmissions'
  );
}

// ── Fetch ALL submissions for ALL coursework in a course ────────────
export async function fetchAllSubmissionsForCourse(
  courseId: string,
  courseWorkList: CourseWork[],
  token: string
): Promise<StudentSubmission[]> {
  const results = await Promise.all(
    courseWorkList.map((cw) => fetchSubmissionsForWork(courseId, cw.id, token))
  );
  return results.flat();
}

// ── Full teacher data bundle for one course ─────────────────────────
export interface TeacherCourseData {
  courseWork:  CourseWork[];
  students:    Student[];
  submissions: StudentSubmission[];
}

export async function fetchTeacherCourseData(
  courseId: string,
  token: string
): Promise<TeacherCourseData> {
  const [courseWork, students] = await Promise.all([
    fetchCourseWork(courseId, token),
    fetchStudents(courseId, token),
  ]);

  const submissions = await fetchAllSubmissionsForCourse(courseId, courseWork, token);

  return { courseWork, students, submissions };
}