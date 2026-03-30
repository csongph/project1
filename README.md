# 🎓 EduDash LMS - Google Classroom Management Portal

**EduDash LMS** เป็นแพลตฟอร์มการจัดการเรียนการสอน (Learning Management System) ที่เชื่อมต่อโดยตรงกับ **Google Classroom API** เพื่อยกระดับประสบการณ์การใช้งานสำหรับทั้ง **นักเรียน (Students)** และ **ครู (Teachers)** ให้มีความสวยงาม ใช้งานง่าย และมีประสิทธิภาพในการติดตามงานมากกว่าเดิม

---

## 🚀 ฟีเจอร์หลัก (Key Features)

ระบบจะทำการตรวจสอบสิทธิ์ (Role Detection) โดยอัตโนมัติเมื่อผู้ใช้เข้าสู่ระบบผ่าน Google Account เพื่อแสดงหน้าจอที่เหมาะสมตามบทบาทของผู้ใช้

### 👨‍🎓 สำหรับนักเรียน (Student Portal)
*   **Unified Dashboard**: แสดงรายการคอร์สเรียนทั้งหมดและงานที่ได้รับมอบหมายในหน้าเดียว
*   **Smart Search & Filter**: ระบบค้นหางานตามชื่อ และตัวกรองสถานะงาน (เช่น งานที่ยังไม่ส่ง, งานที่ส่งแล้ว, งานที่เลยกำหนด)
*   **Assignment Tracking**: ดูรายละเอียดงาน คะแนนเต็ม และวันครบกำหนดได้อย่างชัดเจน
*   **One-Click Action**: สามารถกดส่งงาน (Turn In) หรือยกเลิกการส่ง (Unsubmit) ได้โดยตรงจากระบบ
*   **Visual Progress**: แสดงสถิติการส่งงานในรูปแบบกราฟวงกลม (Pie Chart) เพื่อให้เห็นภาพรวมความคืบหน้าของตนเอง

### 👩‍🏫 สำหรับครู (Teacher Portal)
*   **Course Overview**: หน้าจอสรุปภาพรวมของคอร์สเรียนที่ครูเป็นผู้สอน
*   **Student Submission Tracking**: ตรวจสอบรายชื่อนักเรียนทุกคนในชั้นเรียน พร้อมสถานะการส่งงานแบบ Real-time
*   **Class Analytics**: กราฟแท่งแสดงอัตราการส่งงานในแต่ละชิ้นงาน (Submission Rate) ช่วยให้ครูเห็นว่างานไหนที่นักเรียนมีปัญหา
*   **Grading System**: ระบบให้คะแนน (Grading) และข้อเสนอแนะ (Feedback) กลับไปยังนักเรียนได้ทันที
*   **Assignment Management**: ดูรายละเอียดงานที่มอบหมายไปแล้ว และจัดการข้อมูลเบื้องต้นได้ง่ายขึ้น

---

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend**: React + TypeScript (เพื่อความแม่นยำของข้อมูล)
*   **Styling**: Tailwind CSS (UI ที่ทันสมัยและรองรับทุกหน้าจอ)
*   **Icons**: Lucide React
*   **Charts**: Recharts (สำหรับการแสดงผลสถิติและกราฟ)
*   **API Integration**: Google Classroom API ผ่าน Axios
*   **Authentication**: @react-oauth/google (Google OAuth 2.0)

---

## 📦 โครงสร้างโปรเจกต์ (Project Structure)

```text
src/
├── components/       # ส่วนประกอบย่อย (เช่น Card, Stat, GradingForm)
├── pages/            # หน้าจอหลัก (Dashboard สำหรับครูและนักเรียน)
├── services/         # ส่วนเชื่อมต่อ API (Google Classroom Service)
├── types/            # การกำหนดประเภทข้อมูล (TypeScript Interfaces)
└── utils/            # ฟังก์ชันช่วยคำนวณ (เช่น การจัดการวันที่และสถานะงาน)
```

---

## ⚙️ การติดตั้งและใช้งาน (Installation)

1.  **ติดตั้ง Dependencies**:
    ```bash
    npm install
    ```

2.  **ตั้งค่า Environment Variables**:
    สร้างไฟล์ `.env` และใส่ Client ID ของคุณ:
    ```env
    VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
    ```

3.  **รันโปรเจกต์**:
    ```bash
    npm run dev
    ```

---

## 💡 วิธีการทำงานของระบบ (How it works)

1.  **Login**: ผู้ใช้ล็อกอินผ่าน Google Account
2.  **Role Check**: ระบบจะดึงข้อมูลคอร์สเรียนและตรวจสอบว่าผู้ใช้มีบทบาทเป็น `TEACHER` หรือ `STUDENT` ในคอร์สนั้นๆ
3.  **Data Sync**: ระบบจะดึงข้อมูลงาน (CourseWork) และการส่งงาน (Submissions) จาก Google Classroom มาแสดงผล
4.  **Interaction**: เมื่อมีการส่งงานหรือให้คะแนน ระบบจะส่งคำสั่งกลับไปยัง Google Classroom API เพื่ออัปเดตข้อมูลจริงทันที

---
*พัฒนาและปรับปรุงโดย Manus AI Agent สำหรับโครงการ csongph/myprotalproject*
