import { useState } from 'react';
import { PipelineProvider, usePipeline } from '../components/pipeline/PipelineContext';
import EntityExplorer from '../components/pipeline/EntityExplorer';
import EntityWorkspace from '../components/pipeline/EntityWorkspace';
import RightPanel from '../components/pipeline/RightPanel';
import BottomPanel from '../components/pipeline/BottomPanel';
import ResizeHandle from '../components/pipeline/ResizeHandle';
import MenuBar from '../components/pipeline/MenuBar';
import { cn } from '../lib/utils';

function PipelineLayout() {
    const {
        leftPanelWidth,
        setLeftPanelWidth,
        rightPanelWidth,
        setRightPanelWidth,
        bottomPanelHeight,
        setBottomPanelHeight,
    } = usePipeline();

    const [theme, setTheme] = useState('dark');

    const themeClasses = {
        dark: {
            bg: 'bg-slate-900',
            text: 'text-slate-100',
            border: 'border-slate-700',
        },
        light: {
            bg: 'bg-gray-50',
            text: 'text-gray-900',
            border: 'border-gray-300',
        },
    };

    const t = themeClasses[theme as keyof typeof themeClasses];

    return (
        <div className={cn('h-screen w-screen flex flex-col overflow-hidden', t.bg, t.text)} data-theme={theme}>
            {/* Menu Bar */}
            <MenuBar theme={theme} setTheme={setTheme} />

            {/* Main Content */}
            <div className="flex-1 flex min-h-0">
                {/* Left Panel - Entity Explorer (full height) */}
                <div style={{ width: leftPanelWidth }} className="shrink-0 flex flex-col min-h-0">
                    <EntityExplorer theme={theme} />
                </div>

                <ResizeHandle
                    direction="horizontal"
                    onResize={setLeftPanelWidth}
                    minSize={180}
                    maxSize={400}
                    theme={theme}
                />

                {/* Center Column - Workspace + Bottom Panel */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    {/* Workspace */}
                    <div className="flex-1 min-h-0">
                        <EntityWorkspace theme={theme} />
                    </div>

                    <ResizeHandle
                        direction="vertical"
                        onResize={setBottomPanelHeight}
                        minSize={100}
                        maxSize={400}
                        theme={theme}
                    />

                    {/* Bottom Panel - Logs & Version Control */}
                    <div style={{ height: bottomPanelHeight }} className="shrink-0">
                        <BottomPanel theme={theme} />
                    </div>
                </div>

                <ResizeHandle
                    direction="horizontal"
                    onResize={(size) => setRightPanelWidth(window.innerWidth - size)}
                    minSize={window.innerWidth - 400}
                    maxSize={window.innerWidth - 250}
                    theme={theme}
                />

                {/* Right Panel - Operations & AI Copilot (full height) */}
                <div style={{ width: rightPanelWidth }} className="shrink-0 min-h-0">
                    <RightPanel theme={theme} />
                </div>
            </div>
        </div>
    );
}

export default function Pipeline() {
    return (
        <PipelineProvider>
            <PipelineLayout />
        </PipelineProvider>
    );
}