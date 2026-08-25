import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Message, Sender, Topic } from './types';
import { TOPICS } from './constants';
import { initializeChat, sendMessageStream, resetChat, hasApiKey } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import Button from './components/Button';
import TopicSelector from './components/TopicSelector';
import ExportModal from './components/ExportModal';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!hasApiKey()) {
        setApiKeyError('Chưa có API key Gemini. Hãy thêm GEMINI_API_KEY vào file .env.local để app hoạt động bình thường.');
        setMessages([
          {
            id: 'welcome',
            text: "Chào em! Thầy là giáo viên Toán lớp 8 đây.\n\nHiện tại phần AI chưa thể kết nối vì chưa có khóa API Gemini. Em hãy thêm biến môi trường GEMINI_API_KEY vào file .env.local rồi khởi động lại ứng dụng để thầy có thể hỗ trợ học tập nhé!",
            sender: Sender.AI,
            timestamp: new Date(),
            isError: true
          }
        ]);
        return;
      }

      try {
        await initializeChat();
        setMessages([
          {
            id: 'welcome',
            text: "Chào em! Thầy là giáo viên Toán lớp 8 đây. Hôm nay em muốn học phần nào? 🌱\n\nThầy có thể giúp em:\n1. Ôn tập kiến thức về **Đơn thức** và **Đa thức**.\n2. **Kiểm tra bài tập**, sửa lỗi và hướng dẫn giải chi tiết.\n\nEm hãy chọn các chủ đề ở danh mục bên trái để bắt đầu, hoặc gửi ảnh bài làm (có thể gửi nhiều ảnh cùng lúc) để thầy chấm chữa nhé!",
            sender: Sender.AI,
            timestamp: new Date()
          }
        ]);
      } catch (error) {
        console.error("Initialization failed", error);
        setApiKeyError('Không thể kết nối đến Gemini. Vui lòng kiểm tra lại API key trong file .env.local.');
        setMessages([
          {
            id: 'welcome',
            text: "Chào em! Thầy là giáo viên Toán lớp 8 đây.\n\nHiện tại ứng dụng chưa thể kết nối tới Gemini. Em hãy kiểm tra lại API key trong .env.local rồi khởi động lại ứng dụng nhé!",
            sender: Sender.AI,
            timestamp: new Date(),
            isError: true
          }
        ]);
      }
    };
    init();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const readers = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(readers).then(results => {
        setSelectedImages(prev => [...prev, ...results]);
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleNewChat = () => {
    resetChat();
    setMessages([{
      id: `welcome-${Date.now()}`,
      text: "Chào em! Thầy là giáo viên Toán lớp 8 đây. Hôm nay em muốn học phần nào? 🌱\n\nEm hãy chọn một chủ đề ở danh mục bên trái hoặc nhập câu hỏi để bắt đầu nhé!",
      sender: Sender.AI,
      timestamp: new Date()
    }]);
    setInputText('');
    setSelectedImages([]);
    setCurrentTopicId(null);
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (text: string, clearHistory: boolean = false) => {
    if (apiKeyError) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Ứng dụng chưa được cấu hình API Gemini. Vui lòng thêm GEMINI_API_KEY vào file .env.local và khởi động lại ứng dụng.',
        sender: Sender.AI,
        timestamp: new Date(),
        isError: true
      }]);
      return;
    }

    if ((!text.trim() && selectedImages.length === 0) && !clearHistory) return;
    if (isLoading && !clearHistory) return;

    if (clearHistory) {
      resetChat();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      sender: Sender.USER,
      timestamp: new Date()
    };

    setMessages(prev => clearHistory ? [userMessage] : [...prev, userMessage]);
    setInputText('');
    const imagesToSend = selectedImages.length > 0 ? selectedImages : undefined;
    setSelectedImages([]);
    setIsLoading(true);

    if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
    }

    try {
      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: Message = {
        id: aiMessageId,
        text: '',
        sender: Sender.AI,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, initialAiMessage]);

      const stream = await sendMessageStream(text, imagesToSend);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: fullText } : msg
        ));
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Ôi, mạng bị lag rồi! Em thử hỏi lại thầy một lần nữa nhé. 😓",
        sender: Sender.AI,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    if (apiKeyError) {
      return;
    }
    setCurrentTopicId(topic.id);
    setIsSidebarOpen(false);
    const isCheckHomework = topic.id === 'check_homework';
    handleSendMessage(topic.promptTrigger, isCheckHomework);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText, false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex md:flex-col
      `}>
        <div className="p-6 border-b border-slate-200 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
            📐
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Gia Sư Toán 8</h1>
            <p className="text-xs text-indigo-600 font-medium">Kết nối tri thức</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col justify-between">
            <div>
              {apiKeyError && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 leading-relaxed">
                  ⚠️ {apiKeyError}
                </div>
              )}

              <TopicSelector 
                onSelectTopic={handleTopicSelect} 
                currentTopicId={currentTopicId}
                disabled={isLoading || !!apiKeyError}
              />

              <div className="mt-4 px-2">
                <button
                  onClick={handleNewChat}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Bắt đầu một đoạn chat mới"
                >
                  <span className="text-base">＋</span>
                  <span>Đoạn chat mới</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={messages.length === 0}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Lưu lại toàn bộ đoạn chat để nộp lên Google Drive"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">💾</span>
                  <span>Lưu lịch sử chat</span>
                </button>
              </div>
            </div>

            {deferredPrompt && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-semibold mb-2">Trải nghiệm tốt hơn!</p>
                <Button 
                  onClick={handleInstallClick}
                  variant="primary" 
                  size="sm" 
                  className="w-full shadow-md"
                >
                  Tải ứng dụng 📱
                </Button>
              </div>
            )}
        </div>
        
        <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center flex items-center justify-center gap-1">
            <span>Học tập vui vẻ cùng AI</span> 🌱
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm shadow-md">
                📐
            </div>
            <span className="font-bold text-slate-700 text-sm">Gia Sư Toán 8</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs font-semibold"
              title="Lưu lịch sử bài học"
            >
              <span>💾</span>
              <span className="hidden sm:inline">Lưu</span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Desktop Header Bar */}
        <header className="hidden md:flex h-14 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Chủ đề hiện tại:</span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/80">
              {TOPICS.find(t => t.id === currentTopicId)?.title || 'Hướng dẫn chung'}
            </span>
          </div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all shadow-sm group"
            title="Lưu lại lịch sử chat tải về máy hoặc nộp lên Google Drive"
          >
            <span className="group-hover:scale-110 transition-transform">💾</span>
            <span>Lưu lịch sử chat</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-fixed">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length-1]?.sender === Sender.USER && (
             <div className="flex w-full mb-4 justify-start">
               <div className="flex max-w-[75%] flex-row items-end gap-2">
                 <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm shadow-sm">👨‍🏫</div>
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                    <span className="block w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="block w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                    <span className="block w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col">
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative inline-block group">
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-red-50 z-10" onClick={() => clearImage(idx)}>
                       <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                    </div>
                    <img 
                      src={img} 
                      alt="Preview" 
                      className="h-24 w-auto rounded-xl border border-indigo-100 shadow-sm object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple
                onChange={handleImageUpload} 
              />
              <Button 
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !!apiKeyError}
                className="h-[44px] w-[44px] !p-0 rounded-xl flex-shrink-0 text-slate-500 hover:text-indigo-600 mb-[1px]"
                title="Tải ảnh lên"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Button>

              <textarea
                ref={textAreaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={apiKeyError ? 'Cần cấu hình API key trước khi chat...' : 'Nhập câu hỏi hoặc gửi ảnh bài tập...'}
                disabled={isLoading || !!apiKeyError}
                className="
                  flex-1 max-h-32 min-h-[44px] py-3 px-4 rounded-xl border border-slate-300 bg-slate-50
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none
                  text-slate-700 placeholder-slate-400 shadow-inner
                "
                rows={1}
              />
              <Button 
                onClick={() => handleSendMessage(inputText, false)} 
                disabled={(!inputText.trim() && selectedImages.length === 0) || isLoading || !!apiKeyError}
                className="h-[44px] w-[44px] !p-0 rounded-full flex-shrink-0 mb-[1px]"
              >
                <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Thầy chỉ hướng dẫn, không giải bài hộ đâu nhé! ✏️
          </p>
        </div>
      </main>

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
        currentTopicTitle={TOPICS.find(t => t.id === currentTopicId)?.title}
      />
    </div>
  );
};

export default App;