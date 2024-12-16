// src/App.tsx (React/TypeScript frontend)
import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readTextFile } from '@tauri-apps/api/fs';
import { writeText } from '@tauri-apps/api/clipboard';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

import FileExplorer from './components/FileExplorer';
import TemplateManager from './components/TemplateManager';
import IgnorePatterns from './components/IgnorePatterns';
import { FileEntry, Template, IgnorePattern } from './types';

function App() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [ignorePatterns, setIgnorePatterns] = useState<IgnorePattern[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [totalTokens, setTotalTokens] = useState<number>(0);

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected && !Array.isArray(selected)) {
      setSelectedFolder(selected);
      await loadFiles(selected);
    }
  };

  const loadFiles = async (folderPath: string) => {
    try {
      const entries = await readDir(folderPath, { recursive: true });
      const processedFiles = await processEntries(entries);
      setFiles(processedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const processEntries = async (entries: any[]): Promise<FileEntry[]> => {
    const processed: FileEntry[] = [];

    for (const entry of entries) {
      if (!shouldIgnoreFile(entry.path)) {
        const fileEntry: FileEntry = {
          path: entry.path,
          name: entry.name,
          selected: false,
          isDirectory: entry.children !== undefined,
        };

        if (entry.children) {
          fileEntry.children = await processEntries(entry.children);
        }

        processed.push(fileEntry);
      }
    }

    return processed;
  };

  const shouldIgnoreFile = (path: string): boolean => {
    return ignorePatterns.some(pattern =>
      new RegExp(pattern.pattern).test(path)
    );
  };

  const handleFileSelect = (file: FileEntry) => {
    const updateFileSelection = (files: FileEntry[]): FileEntry[] => {
      return files.map(f => {
        if (f.path === file.path) {
          return { ...f, selected: !f.selected };
        }
        if (f.children) {
          return { ...f, children: updateFileSelection(f.children) };
        }
        return f;
      });
    };

    setFiles(updateFileSelection(files));
  };

  const handleSelectAll = () => {
    const selectAllFiles = (files: FileEntry[]): FileEntry[] => {
      return files.map(f => ({
        ...f,
        selected: !f.isDirectory,
        children: f.children ? selectAllFiles(f.children) : undefined,
      }));
    };

    setFiles(selectAllFiles(files));
  };

  const handleClearSelection = () => {
    const clearSelection = (files: FileEntry[]): FileEntry[] => {
      return files.map(f => ({
        ...f,
        selected: false,
        children: f.children ? clearSelection(f.children) : undefined,
      }));
    };

    setFiles(clearSelection(files));
  };

  const handleAddTemplate = (template: Omit<Template, 'id'>) => {
    const newTemplate: Template = {
      ...template,
      id: uuidv4(),
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleUseTemplate = (template: Template) => {
    setInstructions(prev => prev + (prev ? '\n\n' : '') + template.content);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleAddPattern = (pattern: string) => {
    const newPattern: IgnorePattern = {
      id: uuidv4(),
      pattern,
    };
    setIgnorePatterns([...ignorePatterns, newPattern]);
  };

  const handleRemovePattern = (patternId: string) => {
    setIgnorePatterns(ignorePatterns.filter(p => p.id !== patternId));
  };

  const getSelectedFilesContent = async () => {
    const getContent = async (files: FileEntry[]): Promise<string[]> => {
      const contents: string[] = [];

      for (const file of files) {
        if (file.selected && !file.isDirectory) {
          try {
            const content = await readTextFile(file.path);
            contents.push(`File: ${file.path}\n\n${content}\n`);
          } catch (error) {
            console.error(`Error reading file ${file.path}:`, error);
          }
        }

        if (file.children) {
          contents.push(...await getContent(file.children));
        }
      }

      return contents;
    };

    return (await getContent(files)).join('\n---\n\n');
  };

  const handleCopyToClipboard = async () => {
    const fileContents = await getSelectedFilesContent();
    const output = `Instructions:\n${instructions}\n\nSelected Files:\n${fileContents}`;

    try {
      await writeText(output);
      // You might want to show a success notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // You might want to show an error notification here
    }
  };

  // Calculate total tokens (rough estimate: 4 chars = 1 token)
  useEffect(() => {
    const calculateTokens = async () => {
      const fileContents = await getSelectedFilesContent();
      const totalChars = fileContents.length + instructions.length;
      setTotalTokens(Math.ceil(totalChars / 4));
    };

    calculateTokens();
  }, [files, instructions]);

  return (
    <div className="app-container">
      <div className="toolbar">
        <button onClick={handleSelectFolder}>Select Folder</button>
        <button onClick={handleClearSelection}>Clear Files</button>
      </div>

      <div className="main-content">
        <FileExplorer
          files={files}
          onFileSelect={handleFileSelect}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
        />

        <div className="editor-section">
          <div className="instructions-editor">
            <h3>Instructions</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter your instructions..."
            />
          </div>

          <IgnorePatterns
            patterns={ignorePatterns}
            onAddPattern={handleAddPattern}
            onRemovePattern={handleRemovePattern}
          />

          <TemplateManager
            templates={templates}
            onAddTemplate={handleAddTemplate}
            onUseTemplate={handleUseTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </div>
      </div>

      <div className="footer">
        <div className="token-counter">Total Tokens: {totalTokens}</div>
        <button onClick={handleCopyToClipboard}>Copy to Clipboard</button>
      </div>
    </div>
  );
}

export default App;
