import React, { ReactNode } from 'react';

interface TabPanelProps {
    children: ReactNode;
    value: string;
    activeTab: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, value, activeTab }) => {
    if (value !== activeTab) return null;

    return (
        <div
            role="tabpanel"
            id={`${value}-panel`}
            aria-labelledby={`${value}-tab`}
            className="py-6 focus:outline-none"
        >
            {children}
        </div>
    );
};
