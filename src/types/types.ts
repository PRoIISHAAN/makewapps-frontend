export interface FileMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  steps?: Step[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileTreeNode[];
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export enum StepType {
  CreateFile,
  CreateFolder,
  DeleteFile,
  RunScript,
  Composite
}

export interface Step {
    id: number;
    title: string;
    description: string;
    type: StepType;
    status: "pending" | "in-progress" | "completed" | "error" | "isStreaming";
    code?: string;
  path?: string;
  steps?: Step[];
}
