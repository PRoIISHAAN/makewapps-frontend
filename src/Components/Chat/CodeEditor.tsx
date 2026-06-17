import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Code2 } from "lucide-react";
import type { FileTreeNode } from "../../types/types";
import { Group, Panel, Separator } from "react-resizable-panels";
import { FileExplorer } from "./FileExplorer";

interface CodeEditorProps {
  filePath: string | null;
  content: string;
  editorref: React.RefObject<any>;
  viewmode: string;
  onContentChange: (path: string, content: string) => void;
  files: FileTreeNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}

export function CodeEditor({
  filePath,
  content,
  onContentChange,
  editorref,
  viewmode,
  files,
  selectedFile,
  onFileSelect,
}: CodeEditorProps) {
  const editorInstanceRef = useRef<any>(null);

  const scrollToBottom = () => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const model = editor.getModel?.();
    if (!model) return;

    const lastLine = model.getLineCount();
    requestAnimationFrame(() => {
      editor.revealLineInCenterIfOutsideViewport?.(lastLine);
      editor.revealLine?.(lastLine);
    });
  };

  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const model = editor.getModel?.();
    if (!model) return;

    if (model.getValue() !== content) {
      editor.setValue(content);
      scrollToBottom();
    }
  }, [content]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
  try {
    (editor as any).monaco = monaco;
    
    monaco.editor.defineTheme('tailwind-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e21',
        'editorGutter.background': '#1e1e21',
      },
    });

    monaco.editor.setTheme('tailwind-dark');
    // Disable TypeScript/JavaScript diagnostics — packages aren't available to Monaco
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false, // keep syntax errors
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    // Suppress module resolution errors specifically
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      noEmit: true,
    });
  } catch (err) {
    // ignore
  }
  editorInstanceRef.current = editor;
  editorref.current = editor;
  editor.onDidChangeModelContent(() => {
    scrollToBottom();
  });
};
  if (!filePath) {
    return (
      <div
        className={`h-full flex items-center justify-center ${viewmode === "code" ? "block" : "hidden"}`}
      >
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Code2 className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/50  text-lg font-medium">No file selected</p>
          <p className="text-white/20 text-sm mt-2">
            Choose a file from the explorer to view or edit it
          </p>
        </div>
      </div>
    );
  }

  const getLanguage = (): string => {
    const ext = filePath.split(".").pop();
    switch (ext) {
      case "html":
        return "html";
      case "css":
        return "css";
      case "js":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "json":
        return "json";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onContentChange(filePath, value);
    }
  };

  const fileName = filePath.split("/").pop() || filePath;

  return (
    <div
      className={`h-full flex flex-col ${viewmode === "code" ? "flex" : "hidden"}`}
    >
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize={250} minSize={200} maxSize={400}>
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            </Panel>
            <Separator className="w-1 bg-slate-700/50 hover:bg-emerald-500 transition-colors cursor-col-resize" />
            <Panel className="overflow-hidden flex flex-col">
              {!filePath ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Code2 className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-lg font-medium">
                      No file selected
                    </p>
                    <p className="text-slate-600 text-sm mt-2">
                      Choose a file from the explorer to view or edit it
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="h-10 border-b border-slate-700/50 flex items-center px-3 flex-shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm text-slate-300 border-t border-x border-slate-700/50 -mb-px">
                      <Code2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{fileName}</span>
                      <span className="text-xs text-slate-500 px-2 py-0.5 rounded">
                        {getLanguage().toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={getLanguage()}
                      value={content}
                      onChange={handleChange}
                      onMount={handleEditorDidMount}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily:
                          "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
                        fontLigatures: true,
                        lineNumbers: "on",
                        renderLineHighlight: "line",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        padding: { top: 16, bottom: 16 },
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        scrollbar: {
                          vertical: "auto",
                          horizontal: "auto",
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8,
                          
                        },
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        overviewRulerLanes: 0,
                        bracketPairColorization: { enabled: true },
                      }}
                    />
                  </div>
                </div>
              )}
            </Panel>
          </Group>
    </div>
  );
}

export default CodeEditor;
