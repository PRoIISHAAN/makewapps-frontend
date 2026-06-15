import { useState, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import {
  type Step,
  type FileMessage,
  type FileTreeNode,
  StepType,
} from "../types/types.ts";
import { ChatPanel } from "../Components/Chat/ChatPanel";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { CodeEditor } from "../Components/Chat/CodeEditor";
import { Preview } from "../Components/Chat/Preview";
import { generateSteps } from "../utils/fileGenerator";
import { applyStepToFileTree } from "../utils/fileTree";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Zap, Eye, Code } from "lucide-react";
import { BACKEND_URL } from "../config.ts";
import { StreamingXmlParser } from "../utils/utils.ts";
import { Queue } from "../utils/Queue.ts";
import * as Diff from "diff";

export function ChatPage() {
  const [iFrameUrl, setIframeUrl] = useState("");
  const [, setTitle] = useState("");
  const userPromptsRef = useRef<string[]>([]);
  const editorref = useRef<any>(null);
  const runCommandRef = useRef<Boolean>(false);
  const ApplyingToFileTreeRef = useRef(false);
  const llmFileContentsRef = useRef<Record<string, string>>({});
  const webcontainerRef = useRef<WebContainer | null>(null);
  const [messages, setMessages] = useState<FileMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI website builder. Describe the website you want to create, and I'll generate the files for you.",
      timestamp: new Date(),
    },
  ]);

  const buildFileModifications = (): string => {
    const modifiedFiles: string[] = [];

    const collectFiles = (nodes: FileTreeNode[]) => {
      for (const node of nodes) {
        if (node.type === "file" && node.content !== undefined) {
          const llmVersion = llmFileContentsRef.current[node.path];

          if (llmVersion !== undefined && node.content !== llmVersion) {
            const diffResult = Diff.createPatch(
              node.path,
              llmVersion,
              node.content,
              "",
              "",
            );

            // Strip the 4-line header bolt.new omits (---, +++, @@... is kept)
            const lines = diffResult.split("\n");
            const stripped = lines.slice(4).join("\n");

            if (stripped.length > node.content.length) {
              modifiedFiles.push(
                `<file path="${node.path}">\n${node.content}\n</file>`,
              );
            } else {
              modifiedFiles.push(
                `<diff path="${node.path}">\n${stripped}\n</diff>`,
              );
            }
          }
        }
        if (node.type === "folder" && node.children) {
          collectFiles(node.children);
        }
      }
    };

    collectFiles(filesRef.current);

    if (modifiedFiles.length === 0) return "";
    return `<fileModifications>\n${modifiedFiles.join("\n")}\n</fileModifications>`;
  };
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  const spawnShell = async () => {
  if (!webcontainerRef.current || !xtermRef.current) return;
  
  const terminal = xtermRef.current;
  const shellProcess = await webcontainerRef.current.spawn('jsh', {
    terminal: {
      cols: terminal.cols,
      rows: terminal.rows,
    },
  });

  shellProcess.output.pipeTo(
    new WritableStream({ write(data) { terminal.write(data); } })
  );

  const input = shellProcess.input.getWriter();
  terminal.onData((data) => input.write(data));

  // Handle terminal resize
  terminal.onResize(({ cols, rows }) => {
    shellProcess.resize({ cols, rows });
  });
};

  const initTerminal = () => {
  if (xtermRef.current || !terminalRef.current) return;

  const terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: "#0f172a",
      foreground: "#e2e8f0",
    },
  });

  terminal.open(terminalRef.current);
  xtermRef.current = terminal;

  // Remove the onData handler here entirely — spawnShell manages I/O
  
  return terminal;
};

  const npmInstall = async () => {
    if (webcontainerRef.current) {
      const terminal = xtermRef.current;
      const process = await webcontainerRef.current.spawn("npm", ["install"]);
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal?.write(data);
          },
        }),
      );
      await process.exit;
    }
  };

  const npmRun = async (script: string) => {
    if (webcontainerRef.current) {
      const terminal = xtermRef.current;
      const process = await webcontainerRef.current.spawn("npm", [
        "run",
        script,
      ]);
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal?.write(data);
          },
        }),
      );
      webcontainerRef.current.on("server-ready", (_, url) => {
        setIframeUrl(url);
      });
    }
  };
  const stepsRef = useRef<Step[]>([]);
  const [files, setFiles] = useState<FileTreeNode[]>([]);
  const filesRef = useRef<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const selectedFileRef = useRef<string | null>(null);
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const stepsQueueRef = useRef(new Queue<Step>());
  const assistantMessageIdRef = useRef<string | null>(null);
  const assistantNarrationRef = useRef<string>("");

  const ensureAssistantMessage = () => {
    if (assistantMessageIdRef.current) return;

    const id = (Date.now() + 1).toString();
    assistantMessageIdRef.current = id;
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        steps: [],
      },
    ]);
  };

  const updateSteps = (newSteps: Step[]) => {
  stepsRef.current = newSteps;
  ensureAssistantMessage();

  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === assistantMessageIdRef.current
        ? { ...msg, steps: newSteps }
        : msg,
    ),
  );
};

  const updateAssistantMessageContent = (content: string) => {
    ensureAssistantMessage();

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageIdRef.current ? { ...msg, content } : msg,
      ),
    );
  };

  function updateFileContent(
    nodes: FileTreeNode[],
    path: string,
    content: string,
  ): FileTreeNode[] {
    return nodes.map((node) => {
      if (node.type === "file" && node.path === path) {
        return { ...node, content };
      }
      if (node.type === "folder" && node.children) {
        return {
          ...node,
          children: updateFileContent(node.children, path, content),
        };
      }
      return node;
    });
  }

  const isApplyingCompleteRef = useRef(false);
  const pendingApplyCompleteRef = useRef(false);

  const runStep = async (step: Step) => {
    if (step.type === StepType.Composite) {
      for (const childStep of step.steps ?? []) {
        await runStep(childStep);
      }
      return;
    }

    if (
      step.type === StepType.RunScript &&
      step.code &&
      webcontainerRef.current
    ) {
      console.log("Running command:", step.code);
      for (const code of step.code.split("&&")) {
        const [cmd, ...args] = code.trim().split(" ");
        if (
          (args[0] === "run" || args[0] === "start") &&
          runCommandRef.current === false
        ) {
          runCommandRef.current = true;
          await npmRun(args[1] ?? args[0]);
          return;
        }
        if (args[0] === "install") {
          await npmInstall();
          return;
        }
        const process = await webcontainerRef.current.spawn(cmd, args);
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(data);
            },
          }),
        );
        await process.exit;
      }
    }

    await applyStepToFileTree(
      filesRef,
      setFiles,
      step,
      webcontainerRef.current!,
    );
  };

  const applyCompleted = async (steps: Step[]) => {
    if (isApplyingCompleteRef.current) {
      pendingApplyCompleteRef.current = true;
      return;
    }
    isApplyingCompleteRef.current = true;
    if (!webcontainerRef.current) {
      const webcontainerInstance = await WebContainer.boot();
      webcontainerRef.current = webcontainerInstance;
      initTerminal();
      spawnShell()
    }
    for (const step of steps) {
      if (step.status === "isStreaming") {
        continue;
      }
      if (step.status !== "pending") {
        continue;
      }

      try {
        updateSteps(
          stepsRef.current.map((s) =>
            s.id === step.id ? { ...s, status: "in-progress" } : s,
          ),
        );

        await runStep(step);
        updateSteps(
          stepsRef.current.map((s) =>
            s.id === step.id ? { ...s, status: "completed" } : s,
          ),
        );
      } catch (err) {
        console.error("Step execution error:", err);
        updateSteps(
          stepsRef.current.map((s) =>
            s.id === step.id ? { ...s, status: "error" } : s,
          ),
        );
      }
    }

    isApplyingCompleteRef.current = false;
    if (pendingApplyCompleteRef.current) {
      pendingApplyCompleteRef.current = false;
      await applyCompleted(stepsRef.current);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: FileMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    assistantNarrationRef.current = "";
    assistantMessageIdRef.current = null;
    setMessages((prev) => [...prev, userMessage]);

    setIsGenerating(true);

    if (stepsRef.current.length === 0) {
      const templateApiResponse = await generateSteps(content);
      const templateSteps = templateApiResponse.steps;
      userPromptsRef.current = [
        ...userPromptsRef.current,
        ...templateApiResponse.prompts,
      ];
      updateSteps(templateSteps);

      applyCompleted(stepsRef.current);
      for (const step of stepsRef.current) {
        if (step.path && step.code) {
          llmFileContentsRef.current[step.path] = step.code;
        }
      }
    }

    const nextStepId =
      stepsRef.current.length > 0 ? stepsRef.current.length + 1 : 1;

    const parser = new StreamingXmlParser(
      nextStepId,
      async (step) => {
        console.log("New step received:", step);
        updateSteps([...stepsRef.current, step]);
        if (
          (step.type === StepType.CreateFile ||
            step.type === StepType.CreateFolder) &&
          webcontainerRef.current
        ) {
          stepsQueueRef.current.enqueue(step);
          if (ApplyingToFileTreeRef.current) return; // avoid concurrent modifications to file tree
          while (!stepsQueueRef.current.isEmpty) {
            ApplyingToFileTreeRef.current = true;
            const step = stepsQueueRef.current.dequeue();
            await applyStepToFileTree(
              filesRef,
              setFiles,
              step as Step,
              webcontainerRef.current,
            );
            if (step?.path) {
              selectedFileRef.current = step.path;
              setSelectedFile(selectedFileRef.current);
            }
            setViewMode("code");
          }
          ApplyingToFileTreeRef.current = false;
        }
      },
      (stepId, code) => {
        updateSteps(
          stepsRef.current.map((s) => (s.id === stepId ? { ...s, code } : s)),
        );

        const step = stepsRef.current.find((s) => s.id === stepId);
        if (step?.path) {
          llmFileContentsRef.current[step.path] = code;
          const nextFiles = updateFileContent(
            filesRef.current,
            step.path,
            code,
          );
          filesRef.current = nextFiles;
          setFiles(nextFiles);
        }
      },
      (id) => {
        const step = stepsRef.current.find((s) => s.id === id);
        if (
          step?.type === StepType.RunScript &&
          step.code &&
          runCommandRef.current === true &&
          (step.code.trim().startsWith("npm run") ||
            step.code.trim() === "npm start")
        ) {
          return;
        }
        updateSteps(
          stepsRef.current.map((s) =>
            s.id === id ? { ...s, status: "pending" } : s,
          ),
        );
        applyCompleted(stepsRef.current);
      },
      (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        assistantNarrationRef.current += text;
        updateAssistantMessageContent(assistantNarrationRef.current.trim());
      },
      setTitle,
    );
    const fileModifications = buildFileModifications();
    const userMessageContent = fileModifications
      ? `${fileModifications}\n\n${content}`
      : content;
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompts: [
          ...userPromptsRef.current,
          filesRef.current.length > 0
            ? `current file tree: ${JSON.stringify(filesRef.current)}`
            : "",
          userMessageContent,
        ].filter(Boolean),
        messages,
      }),
    });

    if (!response.body) {
      console.error("No response body — is the backend streaming?");
      setIsGenerating(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.feed(decoder.decode(value, { stream: true }));
    }

    setIsGenerating(false);
    setViewMode("preview");
  };

  const handleFileSelect = useCallback((path: string) => {
    setViewMode("code");
    setSelectedFile(path);
  }, []);

  const handleFileUpdate = useCallback((path: string, content: string) => {
    const updateFile = (nodes: FileTreeNode[]): FileTreeNode[] =>
      nodes.map((node) => {
        if (node.path === path && node.type === "file")
          return { ...node, content };
        if (node.type === "folder" && node.children)
          return { ...node, children: updateFile(node.children) };
        return node;
      });
    filesRef.current = updateFile(filesRef.current);
    setFiles(filesRef.current);
  }, []);

  const getSelectedFileContent = () => {
    const findFile = (nodes: FileTreeNode[], path: string): string => {
      for (const node of nodes) {
        if (node.path === path && node.type === "file")
          return node.content ?? "";
        if (node.type === "folder" && node.children) {
          const found = findFile(node.children, path);
          if (found) return found;
        }
      }
      return "";
    };
    return selectedFile ? findFile(files, selectedFile) : "";
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      <Group orientation="horizontal" className="flex-1">
        <Panel
          defaultSize={400}
          minSize={350}
          maxSize={450}
          className="flex flex-col border-r border-slate-700/50 bg-slate-900"
        >
          <header className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Wapps</h1>
                <p className="text-xs text-slate-400">
                  Create websites with AI
                </p>
              </div>
            </div>
          </header>

          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </Panel>

        <Separator className="w-1 bg-slate-700/50 hover:bg-emerald-500 transition-colors cursor-col-resize" />

        <Panel className="flex flex-col">
          <header className="h-14 px-4 flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "preview"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Preview
                </div>
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "code"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Code className="w-4 h-4" />
                  Code
                </div>
              </button>
            </div>
          </header>
              <Preview viewmode={viewMode} url={iFrameUrl} />
              <CodeEditor
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                viewmode={viewMode}
                filePath={selectedFile}
                content={getSelectedFileContent()}
                onContentChange={handleFileUpdate}
                editorref={editorref}
                terminalRef={terminalRef}
              />
        </Panel>
      </Group>
    </div>
  );
}
