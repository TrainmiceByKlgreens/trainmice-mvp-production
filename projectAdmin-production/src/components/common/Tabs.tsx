import React, { ReactNode } from 'react';

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

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
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
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" role="tablist" aria-label="Tabs">
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
                group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                        >
                            {tab.icon && (
                                <span className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}>
                                    {tab.icon}
                                </span>
                            )}
                            <span>{tab.label}</span>
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span
                                    className={`
                    inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full
                    ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
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
};
