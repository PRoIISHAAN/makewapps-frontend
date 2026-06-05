import type { WebContainer } from "@webcontainer/api";
import type { FileTreeNode, Step } from "../types/types";
import { StepType } from "../types/types";
const normalizePath = (value: string) =>
  value
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

const joinPath = (currentPath: string, name: string) =>
  currentPath ? `${currentPath}/${name}` : name;

const upsertFolder = async (
  nodes: FileTreeNode[],
  parts: string[],
  currentPath: string,
  webcontainerInstance: WebContainer,
): Promise<FileTreeNode[]> => {
  if (parts.length === 0) return nodes;

  const [head, ...rest] = parts;
  const nextPath = joinPath(currentPath, head);
  const folderIndex = nodes.findIndex(
    (node) => node.type === "folder" && node.name === head,
  );

  if (folderIndex === -1) {
    try {
      await webcontainerInstance.fs.mkdir(nextPath);
    } catch (error) {
      console.log(error);
      throw error;
    }
    return [
      ...nodes,
      {
        name: head,
        path: nextPath,
        type: "folder",
        children: await upsertFolder([], rest, nextPath, webcontainerInstance),
      },
    ];
  }

  return await Promise.all(
    nodes.map(async (node, index) => {
      if (index !== folderIndex) return node;

      return {
        ...node,
        children: await upsertFolder(
          node.children ?? [],
          rest,
          nextPath,
          webcontainerInstance,
        ),
      };
    }),
  );
};

const upsertFile = async (
  nodes: FileTreeNode[],
  parts: string[],
  currentPath: string,
  content: string,
  webcontainerInstance: WebContainer,
): Promise<FileTreeNode[]> => {
  if (parts.length === 0) return nodes;

  const [head, ...rest] = parts;
  const nextPath = joinPath(currentPath, head);

  if (rest.length === 0) {
    const fileNode: FileTreeNode = {
      name: head,
      path: nextPath,
      type: "file",
      content,
    };

    const fileIndex = nodes.findIndex(
      (node) => node.type === "file" && node.name === head,
    );
    try {
      await webcontainerInstance.fs.writeFile(nextPath, content);
    } catch (error) {
      console.log(error);
      throw error;
    }
    if (fileIndex === -1) {
      return [...nodes, fileNode];
    }

    return nodes.map((node, index) => (index === fileIndex ? fileNode : node));
  }

  const folderIndex = nodes.findIndex(
    (node) => node.type === "folder" && node.name === head,
  );

  if (folderIndex === -1) {
    try {
      await webcontainerInstance.fs.mkdir(nextPath);
    } catch (error) {
      console.log(error);
      throw error;
    }
    return [
      ...nodes,
      {
        name: head,
        path: nextPath,
        type: "folder",
        children: await upsertFile(
          [],
          rest,
          nextPath,
          content,
          webcontainerInstance,
        ),
      },
    ];
  }

  return await Promise.all(
    nodes.map(async (node, index) => {
      if (index !== folderIndex) return node;

      return {
        ...node,
        children: await upsertFile(
          node.children ?? [],
          rest,
          nextPath,
          content,
          webcontainerInstance,
        ),
      };
    }),
  );
};

const deleteNode = (nodes: FileTreeNode[], path: string): FileTreeNode[] =>
  nodes
    .filter((node) => node.path !== path)
    .map((node) => {
      if (node.type === "folder" && node.children) {
        return { ...node, children: deleteNode(node.children, path) };
      }

      return node;
    });

export const applyStepToFileTree = async (
  nodes: React.RefObject<FileTreeNode[]>,
  setFiles: React.Dispatch<React.SetStateAction<FileTreeNode[]>>,
  step: Step,
  webcontainerInstance?: WebContainer | null,
): Promise<null> => {
  if (!webcontainerInstance) {
    return null;
  }

  const stepPath = (step.path || step.title || "").trim();
  const normalizedParts = normalizePath(stepPath);

  if (step.type === StepType.CreateFolder) {
    if (normalizedParts.length === 0) {
      return null;
    }

    nodes.current = await upsertFolder(
      nodes.current,
      normalizedParts,
      "",
      webcontainerInstance,
    );
    setFiles(nodes.current);
    return null;
  }

  if (step.type === StepType.CreateFile) {
    if (normalizedParts.length === 0) {
      return null;
    }

    nodes.current = await upsertFile(
      nodes.current,
      normalizedParts,
      "",
      step.code || "",
      webcontainerInstance,
    );
    setFiles(nodes.current);
    return null;
  }

  if (step.type === StepType.DeleteFile && step.path) {
    nodes.current = deleteNode(nodes.current, step.path);
    await webcontainerInstance.fs.rm(step.path);
    setFiles(nodes.current);
    return null;
  }

  return null;
};

export const findFirstFilePath = (nodes: FileTreeNode[]): string | null => {
  for (const node of nodes) {
    if (node.type === "file") {
      return node.path;
    }

    if (node.type === "folder" && node.children) {
      const found = findFirstFilePath(node.children);
      if (found) return found;
    }
  }

  return null;
};
