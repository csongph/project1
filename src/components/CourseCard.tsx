import { BookOpen, ArrowUpRight } from 'lucide-react';

export const CourseCard = ({ course }: { course: any }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <BookOpen size={24} />
      </div>
      <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{course.name}</h3>
      <p className="text-sm text-slate-400 mb-6">{course.section || 'General Class'}</p>
      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
        <a 
          href={course.alternateLink} 
          target="_blank" 
          rel="noreferrer"
          className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline"
        >
          เปิดห้องเรียน <ArrowUpRight size={14} />
        </a>
        <span className="text-[10px] font-black text-slate-300 uppercase">Google Classroom</span>
      </div>
    </div>
  );
};