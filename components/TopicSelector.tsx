import React from 'react';
import { TOPICS } from '../constants';
import { Topic } from '../types';

interface TopicSelectorProps {
  onSelectTopic: (topic: Topic) => void;
  currentTopicId: string | null;
  disabled?: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelectTopic, currentTopicId, disabled }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Chủ đề học tập</h3>
      <div className="flex flex-col gap-2">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            disabled={disabled}
            className={`
              text-left px-3 py-2.5 rounded-xl transition-all duration-200 group flex items-center gap-3
              ${currentTopicId === topic.id 
                ? 'bg-white shadow-md shadow-indigo-100 border-l-4 border-indigo-500' 
                : 'hover:bg-white/80 hover:shadow-sm border-l-4 border-transparent hover:border-indigo-200 text-slate-600'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="text-lg bg-slate-50 w-8 h-8 flex items-center justify-center rounded-lg shadow-inner">
                {topic.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${currentTopicId === topic.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                {topic.title}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {topic.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
