import Icon from '@/components/ui/Icon';
import React, { useEffect, useRef } from 'react';
import {LegalText} from './Legal';

type LegalTab = 'privacy' | 'terms' | 'risk';

interface LegalPageProps {
    onBack?: () => void;
    initialTab?: LegalTab;
}

const LegalPage: React.FC<LegalPageProps> = ({ onBack, initialTab = 'terms' }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialTab && containerRef.current) {
            const element = containerRef.current.querySelector(`#${initialTab}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [initialTab]);

    return (
        <div className="p-4 sm:p-8 bg-slate-950 overflow-y-scroll animate-fade-in-right">
            <div className="max-w-4xl mx-auto">
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors font-medium"
                    >
                        <Icon name="arrowLeft" className="w-5 h-5 mr-2" />
                        Back
                    </button>
                )}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Legal Information</h1>
                    <p className="text-slate-400">Please review our policies and terms carefully.</p>
                </div>

                <div className="bg-transparent" ref={containerRef}>
                    <div className="p-2 sm:p-4">
                        <div className="[&>div]:text-base [&_h3]:text-2xl [&_h4]:text-lg [&_p]:text-sm [&_li]:text-sm">
                            <LegalText />
                        </div>
                    </div>
                </div>
                
                <div className="mt-16 text-center text-sm text-slate-500 border-t border-slate-800 pt-8">
                    <p>If you have any questions regarding these documents, please <button className="text-neon-blue hover:underline font-medium">contact our legal team</button>.</p>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
