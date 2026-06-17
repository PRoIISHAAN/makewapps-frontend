import { useState } from 'react';
import type { FileTreeNode } from '../../types/types.ts';
import { ChevronRight, ChevronDown, FileCode, Folder, File, Files as FileIcon } from 'lucide-react';

interface FileExplorerProps {
  files: FileTreeNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}

export function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center px-6 py-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileIcon className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No files yet</p>
          <p className="text-xs text-slate-600 mt-1">Start chatting to generate files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3">
        <FileTree
          nodes={files}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          level={0}
        />
      </div>
    </div>
  );
}

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  level: number;
}

function FileTree({ nodes, selectedFile, onFileSelect, level }: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileNode
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          level={level}
        />
      ))}
    </div>
  );
}

interface FileNodeProps {
  node: FileTreeNode;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  level: number;
}

function FileNode({ node, selectedFile, onFileSelect, level }: FileNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'folder';
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.path);
    }
  };

  const getFileIcon = () => {
    if (isFolder) {
      return isOpen ? (
        <Folder className="w-4 h-4 text-amber-400" />
      ) : (
        <Folder className="w-4 h-4 text-amber-400" />
      );
    }

    const ext = node.name.split('.').pop();
    switch (ext) {
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-400" />;
      case 'css':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'js':
        return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-500" />;
      case 'json':
        return <FileCode className="w-4 h-4 text-green-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-all ${
          isSelected
            ? 'bg-blue-500/20 text-blue-300'
            : 'text-slate-400 hover:bg-blue-800 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isFolder && (
          <span className="text-slate-500">
            {isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        <span className="flex-shrink-0">{getFileIcon()}</span>
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isOpen && node.children && (
        <FileTree
          nodes={node.children}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          level={level + 1}
        />
      )}
    </div>
  );
}
