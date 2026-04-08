import { MessagesView } from '../components/messages/MessagesView';

export function Messages() {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-1 bg-accent-500 rounded-full" />
          <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.3em]">Communication</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-corporate-900 tracking-tighter">
          Message <span className="text-accent-600">Admin</span>
        </h1>
      </div>

      <div className="bg-white rounded-[2rem] shadow-modern-xl overflow-hidden h-[700px] border border-corporate-100">
        <MessagesView />
      </div>
    </div>
  );
}

