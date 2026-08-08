import React from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import './Toolbar.css';
import type {Tool, ToolType} from "./Tool.ts";
import {FaFileExport, FaFileImport} from "react-icons/fa";

interface ToolbarProps {
    activeTool: Tool;
    onSelectTool: (tool: ToolType) => void;
    tools: Tool[];

    onImport: () => void;
    onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
                                             activeTool,
                                             onSelectTool,
                                             tools,

                                             onImport,
                                             onExport
                                         }) => {
    useHotkeys('v', () => onSelectTool('selector'));
    useHotkeys('ctrl+r', (e) => {
        e.preventDefault();
        onSelectTool('rotator')
    });
    useHotkeys('shift+p', () => onSelectTool('placer'));

    return (
        <div className={'toolbar'}>
            <div>
                {tools.map((tool) => (
                    <button
                        key={tool.value}
                        title={tool.title}
                        onClick={() => {
                            tools.forEach(t => t.onUnselect?.());
                            onSelectTool(tool.value)
                        }}
                        className={`toolbar-button ${tool.value === activeTool.value ? 'active' : ''}`}
                        aria-pressed={tool.value === activeTool.value}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>
            <div>
                <button
                    className={`toolbar-button `}
                    title={"Import config file"}
                    onClick={onImport}
                >
                    {<FaFileImport/>}
                </button>
                <button
                    className={`toolbar-button `}
                    title={"Export config file"}
                    onClick={onExport}
                >
                    {<FaFileExport/>}
                </button>
            </div>
        </div>
    );
};

export default Toolbar; 