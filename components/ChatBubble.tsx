import React from 'react';
import { Message, Sender } from '../types';
import katex from 'katex';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const isError = message.isError;

  // Helper to render text and math
  const renderContent = (text: string) => {
    if (!text) return null;

    // Regex to split by $$...$$ or $...$
    // We look for block math first, then inline math
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        try {
          const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        try {
          const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part.split(/(\*\*.*?\*\*)/g).map((subPart, subIdx) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={subIdx} className="font-bold">{subPart.slice(2, -2)}</strong>;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm shadow-sm
          ${isUser ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
          {isUser ? '🧑‍🎓' : '👨‍🏫'}
        </div>

        {/* Bubble */}
        <div className={`
          relative px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm overflow-hidden
          ${isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : isError
              ? 'bg-red-50 text-red-600 border border-red-200 rounded-bl-none'
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
          }
        `}>
          {message.images && message.images.length > 0 && (
            <div className="mb-2 -mx-2 -mt-2 flex flex-wrap gap-2">
              {message.images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt="Uploaded content" 
                  className={`max-w-full h-auto max-h-64 object-contain rounded-lg ${isUser ? 'bg-indigo-700' : 'bg-slate-100'}`}
                />
              ))}
            </div>
          )}
          <div className="font-sans">
            {renderContent(message.text)}
          </div>
          <div className={`text-[10px] mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;