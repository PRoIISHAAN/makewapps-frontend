import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Step, StepType } from "../types/types";

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface ParseXmlOptions {
  groupInitialFiles?: boolean;
}

const normalizeCommand = (command: string) =>
  command.trim().replace(/\s+/g, " ");

const isInstallCommand = (command: string) =>
  normalizeCommand(command) === "npm install";

const isRunServerCommand = (command: string) => {
  const normalized = normalizeCommand(command);
  return normalized === "npm run dev" || normalized === "npm run start";
};

const getShellStepTitle = (command: string) => {
  if (isInstallCommand(command)) {
    return "Install dependencies";
  }

  if (isRunServerCommand(command)) {
    return "Run server";
  }

  return `Run Command: ${command}`;
};

export function parseXml(
  response: string,
  options: ParseXmlOptions = {},
): Step[] {
  // Extract the XML content between <MakeWappsArtifact> tags
  const xmlMatch = response.match(
    /<MakeWappsArtifact[^>]*>([\s\S]*?)<\/MakeWappsArtifact>/,
  );

  if (!xmlMatch) {
    return [];
  }

  const xmlContent = xmlMatch[1];
  const steps: Step[] = [];
  let stepId = 1;

  // Regular expression to find MakeWappsAction elements
  const actionRegex =
    /<MakeWappsAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/MakeWappsAction>/g;

  let match;
  while ((match = actionRegex.exec(xmlContent)) !== null) {
    const [, type, filePath, content] = match;

    if (type === "file") {
      // File creation step
      steps.push({
        id: stepId++,
        title: `Create ${filePath || "file"}`,
        description: "",
        type: StepType.CreateFile,
        status: "pending",
        code: content.trim(),
        path: filePath || undefined,
      });
    } else if (type === "shell") {
      // Shell command step
      steps.push({
        id: stepId++,
        title: getShellStepTitle(content.trim()),
        description: "",
        type: StepType.RunScript,
        status: "pending",
        code: content.trim(),
      });
    }
  }

  if (options.groupInitialFiles) {
    const installStep = steps.find(
      (step) =>
        step.type === StepType.RunScript &&
        step.code &&
        isInstallCommand(step.code),
    );
    const runServerStep = steps.find(
      (step) =>
        step.type === StepType.RunScript &&
        step.code &&
        isRunServerCommand(step.code),
    );
    const initialFileSteps = steps.filter(
      (step) =>
        step.type !== StepType.RunScript ||
        !step.code ||
        (!isInstallCommand(step.code) && !isRunServerCommand(step.code)),
    );

    return [
      {
        id: 1,
        title: "Create initial files",
        description: "",
        type: StepType.Composite,
        status: "pending",
        steps: initialFileSteps,
      },
      ...(installStep
        ? [{ ...installStep, id: 2, title: "Install dependencies" }]
        : []),
      ...(runServerStep
        ? [{ ...runServerStep, id: installStep ? 3 : 2, title: "Run server" }]
        : []),
    ];
  }

  return steps;
}

export type StepCallback = (step: Step) => void;
export type StepUpdateCallback = (stepId: number, code: string) => void;
export type StepCompleteCallback = (stepId: number) => void;
export type NarrationCallback = (text: string) => void;
export type ArtifactTitleCallback = (title: string) => void;

export class StreamingXmlParser {
  private buffer = "";
  private stepId: number;

  private insideArtifact = false;
  private insideAction = false;
  private currentActionType = "";
  private currentFilePath = "";
  private currentContent = "";
  private currentStepId: number | null = null;

  // Callbacks
  onStepCreated: StepCallback;
  onStepContentUpdate: StepUpdateCallback;
  onStepComplete: StepCompleteCallback;
  onNarrationUpdate?: NarrationCallback;
  onArtifactTitle?: ArtifactTitleCallback;

  constructor(
    startingStepId: number,
    onStepCreated: StepCallback,
    onStepContentUpdate: StepUpdateCallback,
    onStepComplete: StepCompleteCallback,
    onNarrationUpdate?: NarrationCallback,
    onArtifactTitle?: ArtifactTitleCallback,
  ) {
    this.stepId = startingStepId;
    this.onStepCreated = onStepCreated;
    this.onStepContentUpdate = onStepContentUpdate;
    this.onStepComplete = onStepComplete;
    this.onNarrationUpdate = onNarrationUpdate;
    this.onArtifactTitle = onArtifactTitle;
  }

  feed(chunk: string): void {
    this.buffer += chunk;

    // ── 1. Detect <MakeWappsArtifact> open ────────────────────────────────────
    if (!this.insideArtifact) {
      const artifactOpen = this.buffer.match(/<MakeWappsArtifact([^>]*)>/);
      if (artifactOpen) {
        const narrationPrefix = this.buffer.slice(
          0,
          this.buffer.indexOf(artifactOpen[0]),
        );
        if (narrationPrefix.trim()) {
          this.onNarrationUpdate?.(narrationPrefix);
        }
        const titleMatch = artifactOpen[1].match(/title="([^"]*)"/);
        if (titleMatch?.[1]) {
          this.onArtifactTitle?.(titleMatch[1]);
        }
        this.insideArtifact = true;

        this.buffer = this.buffer.slice(
          this.buffer.indexOf(artifactOpen[0]) + artifactOpen[0].length,
        );
      } else {
        const firstTagStart = this.buffer.indexOf("<");
        if (firstTagStart === -1) {
          if (this.buffer.trim()) {
            this.onNarrationUpdate?.(this.buffer);
          }
          this.buffer = "";
        } else if (firstTagStart > 0) {
          const narrationChunk = this.buffer.slice(0, firstTagStart);
          if (narrationChunk.trim()) {
            this.onNarrationUpdate?.(narrationChunk);
          }
          this.buffer = this.buffer.slice(firstTagStart);
        }
      }
    }

    if (!this.insideArtifact) return;

    // ── 2. Detect <MakeWappsAction> open — emit step immediately with empty code
    if (!this.insideAction) {
      const actionOpen = this.buffer.match(/<MakeWappsAction([^>]*)>/);
      if (actionOpen) {
        const attrs = actionOpen[1];
        this.currentActionType = attrs.match(/type="([^"]*)"/)?.[1] ?? "";
        this.currentFilePath = attrs.match(/filePath="([^"]*)"/)?.[1] ?? "";
        this.currentContent = "";
        this.insideAction = true;
        this.currentStepId = this.stepId++;

        // Emit step immediately so file is created before content arrives
        if (this.currentActionType === "file") {
          const step = this.buildStep(this.currentStepId, "");
          if (step) this.onStepCreated(step);
        }
        this.buffer = this.buffer.slice(
          this.buffer.indexOf(actionOpen[0]) + actionOpen[0].length,
        );
      }
    }

    // ── 3. Stream content into the step as it arrives ─────────────────────
    if (this.insideAction && this.currentStepId !== null) {
      const closeIdx = this.buffer.indexOf("</MakeWappsAction>");

      if (closeIdx !== -1) {
        this.currentContent += this.buffer.slice(0, closeIdx);
        this.buffer = this.buffer.slice(closeIdx + "</MakeWappsAction>".length);
        this.insideAction = false;

        const trimmed = this.currentContent.trim();
        this.onStepContentUpdate(this.currentStepId, trimmed);

        // Emit shell steps now that we have the full command
        if (this.currentActionType === "shell") {
          const step = this.buildStep(this.currentStepId, trimmed);
          if (step) this.onStepCreated(step);
        }

        this.onStepComplete(this.currentStepId);
        this.currentStepId = null;
      } else {
        // Still streaming — hold back enough chars to catch a split closing tag
        const safeLen = Math.max(
          0,
          this.buffer.length - "</MakeWappsAction>".length,
        );
        if (safeLen > 0) {
          this.currentContent += this.buffer.slice(0, safeLen);
          // 🔴 Live update — file content grows as stream arrives
          this.onStepContentUpdate(this.currentStepId, this.currentContent);
          this.buffer = this.buffer.slice(safeLen);
        }
      }
    }

    // ── 4. Detect </MakeWappsArtifact> ─────────────────────────────────────────
    if (this.insideArtifact && this.buffer.includes("</MakeWappsArtifact>")) {
      this.insideArtifact = false;
      this.buffer = "";
    }
  }

  private buildStep(id: number, code: string): Step | null {
    if (this.currentActionType === "file") {
      return {
        id,
        title: `Create ${this.currentFilePath || "file"}`,
        description: "",
        type: StepType.CreateFile,
        status: "isStreaming",
        code,
        path: this.currentFilePath || undefined,
      };
    }
    if (this.currentActionType === "shell") {
      return {
        id,
        title: getShellStepTitle(code.trim()),
        description: "",
        type: StepType.RunScript,
        status: "isStreaming",
        code,
      };
    }
    return null;
  }
}
