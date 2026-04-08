import { ReactNode } from 'react';

interface TabPanelProps {
  value: string;
  activeTab: string;
  children: ReactNode;
}

export function TabPanel({ value, activeTab, children }: TabPanelProps) {
  const isActive = value === activeTab;

  return (
    <div
      role="tabpanel"
      id={`${value}-panel`}
      aria-labelledby={`${value}-tab`}
      hidden={!isActive}
      className={`
        transition-opacity duration-200
        ${isActive ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {isActive && children}
    </div>
  );
}
