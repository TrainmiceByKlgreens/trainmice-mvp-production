import { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      onTabChange(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      onTabChange(tabs[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onTabChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onTabChange(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div className="border-b border-corporate-100">
      <nav className="-mb-px flex space-x-12 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Sections">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                group inline-flex items-center gap-3 py-5 px-1 border-b-2 font-bold text-sm transition-all duration-300 whitespace-nowrap outline-none
                ${isActive
                  ? 'border-accent-500 text-corporate-900 glow-effect'
                  : 'border-transparent text-corporate-400 hover:text-corporate-600 hover:border-corporate-200'
                }
              `}
            >
              {tab.icon && (
                <span className={`transition-colors duration-300 ${isActive ? 'text-accent-500' : 'text-corporate-400 group-hover:text-corporate-500'}`}>
                  {tab.icon}
                </span>
              )}
              <span className="tracking-wide uppercase text-xs">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold leading-none rounded-md
                    ${isActive ? 'bg-accent-500 text-white' : 'bg-corporate-100 text-corporate-500'}
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
