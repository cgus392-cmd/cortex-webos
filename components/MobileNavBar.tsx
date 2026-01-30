
import React from 'react';
import { LayoutDashboard, ListTodo, Bot, FileText, Menu, Network } from 'lucide-react';
import { AppTab } from '../types';

interface Props {
    activeTab: AppTab;
    onTabChange: (tab: AppTab) => void;
    onMenuClick: () => void;
}

export const MobileNavBar: React.FC<Props> = ({ activeTab, onTabChange, onMenuClick }) => {
    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
        { id: 'cronos', icon: ListTodo, label: 'Cronos' },
        { id: 'nexus', icon: Network, label: 'Nexus' }, // Central AI/Knowledge Hub
        { id: 'courses', icon: FileText, label: 'Notas' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[safe-area-inset-bottom+60px] bg-[var(--bg-card)]/95 backdrop-blur-xl border-t border-[var(--border-color)] z-50 pb-[env(safe-area-inset-bottom)] px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id as AppTab)}
                            className={`flex flex-col items-center justify-center w-12 transition-all duration-300 ${isActive ? 'text-[var(--accent)] -translate-y-1' : 'text-[var(--text-secondary)] opacity-70 hover:opacity-100'}`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[var(--accent)]/10' : 'bg-transparent'}`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            {isActive && <span className="text-[9px] font-bold mt-0.5 animate-in fade-in slide-in-from-bottom-1">{item.label}</span>}
                        </button>
                    )
                })}
                
                {/* Menu / Settings Trigger */}
                <button 
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-12 text-[var(--text-secondary)] opacity-70 active:scale-90 transition-transform"
                >
                    <Menu size={22} />
                </button>
            </div>
        </div>
    );
};
