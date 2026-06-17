// utils/snapshotInstaller.ts
import { gunzipSync } from "fflate";
import { WebContainer } from "@webcontainer/api";

type SnapshotResult =
  | { success: false; snapshotPackageLock: null }
  | { success: true; snapshotPackageLock: Record<string, { version: string }> };

export async function fetchAndExtractNodeModulesSnapshot(
  snapshotUrl: string,
  webcontainer: WebContainer,
  onProgress?: (msg: string) => void
): Promise<SnapshotResult> {
  try {
    onProgress?.("Fetching snapshot...");
    const response = await fetch(snapshotUrl);
    if (!response.ok) throw new Error(`Snapshot fetch failed: ${response.status}`);

    const compressed = new Uint8Array(await response.arrayBuffer());
    onProgress?.("Decompressing...");
    const tarData = gunzipSync(compressed);

    onProgress?.("Extracting node_modules...");
    const snapshotPackageLock = await extractTar(tarData, webcontainer, onProgress);

    onProgress?.("Snapshot installed ✓");
    return { success: true, snapshotPackageLock };
  } catch (err) {
    console.error("Snapshot install failed:", err);
    return { success: false, snapshotPackageLock: null };
  }
}

async function extractTar(
  data: Uint8Array,
  webcontainer: WebContainer,
  onProgress?: (msg: string) => void
): Promise<Record<string, { version: string }>> {
  let offset = 0;
  let snapshotPackageLock: Record<string, { version: string }> = {};
  const createdDirs = new Set<string>();

  const readString = (start: number, len: number) =>
    new TextDecoder().decode(data.slice(start, start + len)).replace(/\0/g, "").trim();

  const parseOctal = (start: number, len: number) =>
    parseInt(readString(start, len) || "0", 8);

  let filesExtracted = 0;

  while (offset + 512 <= data.length) {
    const header = data.slice(offset, offset + 512);
    if (header.every((b) => b === 0)) {
      offset += 512;
      if (data.slice(offset, offset + 512).every((b) => b === 0)) break;
      continue;
    }

    const name = readString(offset, 100);
    const prefix = readString(offset + 345, 155);
    const fullPath = prefix ? `${prefix}/${name}` : name;
    const typeFlag = readString(offset + 156, 1);
    const size = parseOctal(offset + 124, 12);

    offset += 512;

    // Skip macOS metadata entries (._filename)
    const baseName = fullPath.split("/").pop() ?? "";
    const isMacMeta = baseName.startsWith("._");

    if (!isMacMeta) {
      if (typeFlag === "5" || fullPath.endsWith("/")) {
        if (!createdDirs.has(fullPath)) {
          await webcontainer.fs.mkdir(fullPath, { recursive: true });
          createdDirs.add(fullPath);
        }
      } else if (typeFlag === "0" || typeFlag === "" || typeFlag === "\0") {
        const dir = fullPath.split("/").slice(0, -1).join("/");
        if (dir && !createdDirs.has(dir)) {
          await webcontainer.fs.mkdir(dir, { recursive: true });
          createdDirs.add(dir);
        }

        const content = data.slice(offset, offset + size);
        await webcontainer.fs.writeFile(fullPath, content);

        // Capture the internal package-lock as our baseline
        if (fullPath === "node_modules/.package-lock.json") {
          try {
            const parsed = JSON.parse(new TextDecoder().decode(content));
            // .package-lock.json shape: { packages: { "node_modules/foo": { version } } }
            snapshotPackageLock = parsed.packages ?? {};
          } catch {
            // ignore parse errors
          }
        }

        filesExtracted++;
        if (filesExtracted % 500 === 0) {
          onProgress?.(`Extracting... (${filesExtracted} files)`);
        }
      }
    }

    offset += Math.ceil(size / 512) * 512;
  }

  return snapshotPackageLock;
}