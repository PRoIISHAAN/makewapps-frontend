import { useState, useCallback, useRef, useEffect } from "react";
import { WebContainer } from "@webcontainer/api";
// Add import at top of ChatPage.tsx
import { fetchAndExtractNodeModulesSnapshot } from "../utils/snapshotInstaller.ts";
import {
  type Step,
  type FileMessage,
  type FileTreeNode,
  StepType,
} from "../types/types.ts";
import JSZip from "jszip";
import type { FileSystemTree } from "@webcontainer/api";
import { ChatPanel } from "../Components/Chat/ChatPanel";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { CodeEditor } from "../Components/Chat/CodeEditor";
import { Preview } from "../Components/Chat/Preview";
import { generateSteps } from "../utils/fileGenerator";
import { applyStepToFileTree } from "../utils/fileTree";
import { Panel, Group, Separator } from "react-resizable-panels";
import {
  Zap,
  Eye,
  Code,
  ExternalLink,
  RefreshCw,
  Download,
} from "lucide-react";
import { BACKEND_URL } from "../config.ts";
import { StreamingXmlParser } from "../utils/utils.ts";
import { useLocation } from "react-router-dom";
import { Queue } from "../utils/Queue.ts";
import * as Diff from "diff";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
type ChatSession = {
  messages: FileMessage[];
  files: FileTreeNode[];
  selectedFile: string | null;
  userPrompts: string[];
  llmFileContents: Record<string, string>;
  viewMode: "code" | "preview";
  runScript: string;
};

export function ChatPage() {
  const location = useLocation();
  const [iFrameUrl, setIframeUrl] = useState("");
  const [, setTitle] = useState("");
  const userPromptsRef = useRef<string[]>([]);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [sweepAnimation, setSweepAnimation] = useState(false);
  const editorref = useRef<any>(null);
  const runCommandRef = useRef<Boolean>(false);
  const runScriptRef = useRef<string>("");
  const ApplyingToFileTreeRef = useRef(false);
  const llmFileContentsRef = useRef<Record<string, string>>({});
  const webcontainerRef = useRef<WebContainer | null>(null);
  const [messages, setMessages] = useState<FileMessage[]>([]);
  const [iFrameKey, setIFrameKey] = useState(0);
  const renderQueueRef = useRef<string[]>([]);
  const isRenderingRef = useRef(false);
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
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const isApplyingCompleteRef = useRef(false);
  const pendingApplyCompleteRef = useRef(false);
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const startWordRenderer = async () => {
    if (isRenderingRef.current) return;

    isRenderingRef.current = true;

    while (renderQueueRef.current.length > 0) {
      const token = renderQueueRef.current.shift();

      if (!token) continue;

      assistantNarrationRef.current += token;

      updateAssistantMessageContent(assistantNarrationRef.current);

      const queueSize = renderQueueRef.current.length;

      const delay = queueSize > 300 ? 25 : queueSize > 100 ? 20 : 50;

      await sleep(delay);
    }

    isRenderingRef.current = false;
  };

  const fileTreeToMountTree = (nodes: FileTreeNode[]): FileSystemTree => {
    const result: FileSystemTree = {};

    for (const node of nodes) {
      if (node.type === "folder") {
        result[node.name] = {
          directory: fileTreeToMountTree(node.children ?? []),
        };
      }

      if (node.type === "file") {
        result[node.name] = {
          file: {
            contents: node.content ?? "",
          },
        };
      }
    }

    return result;
  };

  const rebuildWebContainer = async (files: FileTreeNode[]) => {
    setSweepAnimation(true);
    const instance = await WebContainer.boot();
    webcontainerRef.current = instance;

    initTerminal();
    spawnShell();

    const mountTree = fileTreeToMountTree(files);
    await instance.mount(mountTree);
    await npmInstall();
    npmRun(runScriptRef.current);

    return instance;
  };
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

  const saveSession = () => {
    const session: ChatSession = {
      messages,
      files: filesRef.current,
      selectedFile,
      userPrompts: userPromptsRef.current,
      llmFileContents: llmFileContentsRef.current,
      viewMode,
      runScript: runScriptRef.current,
    };

    sessionStorage.setItem("chat-session", JSON.stringify(session));
  };
  const restoreSession = (raw: string) => {
    const session: ChatSession = JSON.parse(raw);
    session.messages = session.messages.map((msg) => ({
      ...msg,
      steps: msg.steps?.map((step) => ({
        ...step,
        status: step.status !== "completed" ? "error" : step.status,
      })),
    }));

    setMessages(session.messages ?? []);

    setFiles(session.files ?? []);
    filesRef.current = session.files ?? [];

    setSelectedFile(session.selectedFile ?? null);

    userPromptsRef.current = session.userPrompts ?? [];

    llmFileContentsRef.current = session.llmFileContents ?? {};

    runScriptRef.current = session.runScript;

    setViewMode(session.viewMode ?? "preview");
  };

  const handleDownload = async () => {
    const zip = new JSZip();

    const addFilesToZip = (nodes: FileTreeNode[], zip: JSZip) => {
      for (const node of nodes) {
        if (node.type === "file" && node.content !== undefined) {
          zip.file(node.path, node.content);
        }
        if (node.type === "folder" && node.children) {
          addFilesToZip(node.children, zip);
        }
      }
    };

    addFilesToZip(filesRef.current, zip);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const spawnShell = async () => {
    if (!webcontainerRef.current || !xtermRef.current) return;

    const terminal = xtermRef.current;
    const shellProcess = await webcontainerRef.current.spawn("jsh", {
      terminal: {
        cols: terminal.cols,
        rows: terminal.rows,
      },
    });

    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      }),
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
        background: "#1e1e21",
        foreground: "#e9e9e9",
      },
      scrollback: 1000,
      disableStdin: false,
      overviewRuler: {
        width: 0,
      }, // removes the overview ruler on the right
    });
    terminal.open(terminalRef.current);
    xtermRef.current = terminal;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = terminal;

    // Refit on resize
    const observer = new ResizeObserver(() => fitAddon.fit());
    observer.observe(terminalRef.current);

    return terminal;
  };

  async function getPackagesToInstall(
    snapshotPackageLock: Record<string, { version: string }>,
    webcontainer: WebContainer,
  ): Promise<string[]> {
    let currentPackageJson: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    try {
      const bytes = await webcontainer.fs.readFile("package.json");
      currentPackageJson = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return [];
    }

    const allRequested = {
      ...currentPackageJson.dependencies,
      ...currentPackageJson.devDependencies,
    };

    const missing: string[] = [];

    for (const [pkg, requestedRange] of Object.entries(allRequested)) {
      const lockKey = `node_modules/${pkg}`;
      const installed = snapshotPackageLock[lockKey];

      if (!installed) {
        // Package not in snapshot at all
        missing.push(`${pkg}@${requestedRange}`);
      }
      // If it IS in the snapshot we trust npm's semver resolution already satisfied
      // the range that was used to build the snapshot. If the project bumped to a
      // range the snapshot can't satisfy, npm install <pkg@range> will catch it.
    }

    return missing;
  }

  const npmInstall = async () => {
    if (!webcontainerRef.current) return;

    const snapshotUrl = sessionStorage.getItem("snapshotUrl");

    if (snapshotUrl) {
      const result = await fetchAndExtractNodeModulesSnapshot(
        snapshotUrl,
        webcontainerRef.current,
      );

      if (result.success) {
        const extraPackages = await getPackagesToInstall(
          result.snapshotPackageLock,
          webcontainerRef.current,
        );
        const terminal = xtermRef.current;
        const process = await webcontainerRef.current.spawn("npm", [
          "install",
          ...extraPackages,
        ]);
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data);
            },
          }),
        );
        await process.exit;
        return;
      }
    }

    // Full fallback
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
  };

  const npmRun = async (script: string) => {
    if (webcontainerRef.current) {
      const terminal = xtermRef.current;
      runScriptRef.current = script;
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
  useEffect(() => {
    const saved = sessionStorage.getItem("chat-session");

    if (saved && JSON.parse(saved).files.length > 0) {
      const session = JSON.parse(saved);

      restoreSession(saved);
      void rebuildWebContainer(session.files);

      return;
    }

    const prompt = location.state?.prompt;

    if (prompt) {
      handleSendMessage(prompt);

      window.history.replaceState({}, "");
    }
  }, []);
  useEffect(() => {
    saveSession();
  }, [messages, files, selectedFile, viewMode]);
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
    ensureAssistantMessage();
    stepsRef.current = newSteps;

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
        if (args[0] === "run" || args[0] === "start") {
          if (runCommandRef.current === false) {
            runCommandRef.current = true;
            await npmRun(args[1] ?? args[0]);
            setViewMode("preview");
            return;
          }
          setIFrameKey((k) => k + 1);
          setViewMode("preview");
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

  const handleOpenInNewTab = () => {
    window.open(iFrameUrl, "_blank");
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
      spawnShell();
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
    stepsRef.current = [];
    try {
      if (stepsRef.current.length === 0 && filesRef.current.length === 0) {
        const templateApiResponse = await generateSteps(content);
        sessionStorage.setItem("snapshotUrl", templateApiResponse.snapshotUrl);
        const templateSteps = templateApiResponse.steps;
        userPromptsRef.current = [
          ...userPromptsRef.current,
          ...templateApiResponse.prompts,
        ];
        updateSteps(templateSteps);

        await applyCompleted(stepsRef.current);
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

            try {
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
            } finally {
              ApplyingToFileTreeRef.current = false;
            }
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
          updateSteps(
            stepsRef.current.map((s) =>
              s.id === id ? { ...s, status: "pending" } : s,
            ),
          );
          applyCompleted(stepsRef.current);
        },
        (text) => {
          const tokens = text.match(/\S+\s*/g) || [];

          renderQueueRef.current.push(...tokens);

          void startWordRenderer();
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

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      if (!response.body) {
        console.error("No response body — is the backend streaming?");
        setIsGenerating(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let chunkText = decoder.decode(value, { stream: true });
        fullText += chunkText;
        if (fullText.includes("[[STREAM_ERROR]]")) {
          throw new Error(
            "The AI model is currently overloaded. Please try again shortly.",
          );
        }
        chunkText = chunkText.replace("[[STREAM_ERROR]]", "");
        parser.feed(chunkText);
      }
    } catch (err) {
      console.error("handleSendMessage error:", err);
      setSweepAnimation(false);

      const message = axios.isAxiosError(err)
        ? err.response?.status === 503
          ? "The AI model is temporarily overloaded. Please try again in a moment."
          : `Request failed (${err.response?.status ?? "network error"}).`
        : err instanceof Error
          ? err.message
          : "Something went wrong while generating your project.";

      toast.error(message);
    } finally {
      setIsGenerating(false);
      if(runCommandRef.current){
        setIFrameKey((k) => k + 1);
        setViewMode("preview");
      }
    }
  };

  const handleFileSelect = useCallback((path: string) => {
    setViewMode("code");
    setSelectedFile(path);
  }, []);

  const handleFileUpdate = useCallback(
    async (path: string, content: string) => {
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
      if (webcontainerRef.current) {
        await webcontainerRef.current.fs.writeFile(path, content);
      }
    },
    [],
  );

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
    <div className="h-screen flex flex-col bg-[#1e1e21] pb-4 text-slate-100 overflow-hidden">
      <div className="flex justify-between py-1 px-4 pt-2">
        <header>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
              <img src="/favicon.svg" alt="Wapps Logo" />
            </div>
            <h1 className="text-xl flex items-center font-semibold text-white">
              Wapps
            </h1>
          </div>
        </header>
        <header className="flex items-center justify-between border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-1 rounded-lg">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-blue-500 text-white shadow-lg shadow-emerald-500/20"
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
                  ? "bg-blue-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                Code
              </div>
            </button>
            <button
              disabled={filesRef.current.length === 0}
              onClick={handleOpenInNewTab}
              className="p-2 rounded-md disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIFrameKey((k) => k + 1)}
              disabled={filesRef.current.length === 0}
              className="p-2 rounded-md disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={filesRef.current.length === 0}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Download project"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </header>
      </div>
      <Group orientation="horizontal" className="flex-1 relative">
        <Panel
          defaultSize={400}
          minSize={350}
          maxSize={450}
          className="flex flex-col border-slate-700/50"
        >
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </Panel>

        <Separator className="w-3 absolute hover:bg-slate-700/20 transition-colors cursor-col-resize" />

        <Panel className="flex h-full flex-col border rounded-xl m-4 ml-0 mt-0">
          <div className={`${viewMode === "code" ? "block" : "hidden"} h-full`}>
            <Group orientation="vertical">
              <Panel>
                <CodeEditor
                  files={files}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  viewmode={viewMode}
                  filePath={selectedFile}
                  content={getSelectedFileContent()}
                  onContentChange={handleFileUpdate}
                  editorref={editorref}
                />
              </Panel>
              <Separator
                className={`w-3 hover:bg-slate-700/20 transition-colors cursor-col-resize`}
              ></Separator>
              <Panel
                style={{
                  display:
                    viewMode === "code" && xtermRef.current ? "block" : "none",
                }}
                defaultSize={150}
                minSize={50}
                collapsible
                className="border-t"
              >
                <div className="h-full" ref={terminalRef} />{" "}
              </Panel>
            </Group>
          </div>
          <div
            className={`${viewMode === "preview" ? "block" : "hidden"} h-full`}
          >
            <Preview
              sweepAnimation={sweepAnimation}
              setSweepAnimation={setSweepAnimation}
              isGenerating={isGenerating}
              viewmode={viewMode}
              url={iFrameUrl}
              iFrameKey={iFrameKey}
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}
