import React from 'react';
import { Message } from '../types';
import { exportChatToHTML, exportChatToText } from '../utils/exportChat';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  currentTopicTitle?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  messages,
  currentTopicTitle
}) => {
  if (!isOpen) return null;

  const handleDownloadHTML = () => {
    exportChatToHTML(messages, currentTopicTitle);
    onClose();
  };

  const handleDownloadText = () => {
    exportChatToText(messages);
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 border border-slate-100 transform transition-all">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
              💾
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Lưu lịch sử bài học</h3>
              <p className="text-xs text-slate-500">Tải về máy để xem lại hoặc nộp lên Google Drive</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-800 leading-relaxed">
            💡 <strong>Mẹo:</strong> Chọn <strong>Tài liệu đẹp (.html)</strong> để lưu lại đầy đủ màu sắc, hình ảnh bài làm và các công thức toán học!
          </div>

          <button
            onClick={handleDownloadHTML}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                📄
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                  Tải về dạng Tài liệu (.html)
                </div>
                <div className="text-xs text-slate-500">
                  Đầy đủ hình ảnh, công thức Toán, dễ up lên Google Drive
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <button
            onClick={handleDownloadText}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                📝
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                  Tải về dạng Văn bản (.txt)
                </div>
                <div className="text-xs text-slate-500">
                  Dạng chữ gọn nhẹ để đọc nhanh hoặc sao chép
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                🖨️
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                  In bài / Lưu thành PDF
                </div>
                <div className="text-xs text-slate-500">
                  Dùng chức năng in của máy để tạo file PDF
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
