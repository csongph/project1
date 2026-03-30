import { useState } from 'react';
import { ArrowLeft, Calendar, Award, Upload, File, X, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface AssignmentDetailProps {
  assignment: any;
  courseName: string;
  onBack: () => void;
  onSubmit: (assignmentId: string, files: File[], comment: string) => Promise<void>;
}

export default function AssignmentDetail({ assignment, courseName, onBack, onSubmit }: AssignmentDetailProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const formatDate = (dueDate: any) => {
    if (!dueDate || !dueDate.day) return 'ไม่มีกำหนดส่ง';
    return `${dueDate.day}/${dueDate.month}/${dueDate.year}`;
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate || !dueDate.year) return false;
    const due = new Date(dueDate.year, (dueDate.month || 1) - 1, dueDate.day || 1);
    return due < new Date();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('กรุณาเลือกไฟล์ที่จะส่ง');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(assignment.id, selectedFiles, comment);
      setSubmitSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการส่งงาน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const overdue = isOverdue(assignment.dueDate);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <ArrowLeft size={20} strokeWidth={2} className="text-neutral-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-neutral-900">{assignment.title}</h1>
              <p className="text-sm text-neutral-500">{courseName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {submitSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} strokeWidth={2} className="text-green-600" />
            <p className="text-sm text-green-600 font-medium">ส่งงานสำเร็จ! กำลังกลับไปหน้าก่อนหน้า...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Info */}
            <div className="bg-white border border-neutral-100 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-100">
                <div className={`p-3 rounded-lg ${overdue ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <Calendar size={20} strokeWidth={2} className={overdue ? 'text-red-600' : 'text-blue-600'} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">กำหนดส่ง</p>
                  <p className={`text-base font-semibold ${overdue ? 'text-red-600' : 'text-neutral-900'}`}>
                    {formatDate(assignment.dueDate)}
                    {overdue && <span className="ml-2 text-xs">(เลยกำหนด)</span>}
                  </p>
                </div>
                {assignment.maxPoints && (
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">คะแนน</p>
                    <p className="text-base font-semibold text-neutral-900 flex items-center gap-1">
                      <Award size={16} strokeWidth={2} />
                      {assignment.maxPoints}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">รายละเอียดงาน</h3>
                <div className="text-sm text-neutral-600 leading-relaxed">
                  {assignment.description || 'ไม่มีคำอธิบาย'}
                </div>
              </div>

              {/* View in Classroom Link */}
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <a 
                  href={assignment.alternateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-neutral-500 hover:text-neutral-900 font-medium inline-flex items-center gap-2 transition"
                >
                  <ExternalLink size={14} strokeWidth={2} />
                  ดูใน Google Classroom
                </a>
              </div>
            </div>

            {/* Submission Form */}
            <div className="bg-white border border-neutral-100 rounded-xl p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-4">ส่งงานของคุณ</h3>

              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  ไฟล์งาน
                </label>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center hover:border-neutral-300 transition">
                  <Upload size={32} strokeWidth={2} className="mx-auto text-neutral-400 mb-3" />
                  <p className="text-sm text-neutral-600 mb-2">คลิกเพื่อเลือกไฟล์หรือลากไฟล์มาวาง</p>
                  <p className="text-xs text-neutral-400 mb-4">รองรับ PDF, DOC, DOCX, JPG, PNG (ไม่เกิน 10MB)</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Upload size={16} strokeWidth={2} />
                    เลือกไฟล์
                  </label>
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-neutral-700 mb-3">
                    ไฟล์ที่เลือก ({selectedFiles.length})
                  </p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <File size={18} strokeWidth={2} className="text-neutral-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                          <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-neutral-200 rounded transition"
                        >
                          <X size={16} strokeWidth={2} className="text-neutral-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  ความคิดเห็น (ไม่บังคับ)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="เพิ่มความคิดเห็นหรือหมายเหตุ..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || submitSuccess || selectedFiles.length === 0}
                className="w-full py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Clock size={18} strokeWidth={2} className="animate-spin" />
                    กำลังส่งงาน...
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle size={18} strokeWidth={2} />
                    ส่งสำเร็จ!
                  </>
                ) : (
                  <>
                    <Upload size={18} strokeWidth={2} />
                    ส่งงาน
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white border border-neutral-100 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">สถานะ</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {overdue ? (
                    <>
                      <AlertCircle size={16} strokeWidth={2} className="text-red-500" />
                      <span className="text-sm text-red-600">เลยกำหนดส่ง</span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} strokeWidth={2} className="text-orange-500" />
                      <span className="text-sm text-orange-600">ยังไม่ส่ง</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">คำแนะนำ</h4>
              <ul className="space-y-2 text-xs text-blue-700">
                <li>• ตรวจสอบไฟล์ก่อนส่ง</li>
                <li>• ไฟล์ต้องไม่เกิน 10MB</li>
                <li>• สามารถส่งหลายไฟล์พร้อมกันได้</li>
                <li>• เก็บสำเนาไฟล์ไว้ด้วย</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}