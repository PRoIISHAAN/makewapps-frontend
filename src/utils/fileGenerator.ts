import type { Step } from "../types/types";
import { BACKEND_URL } from "../config";
import axios from "axios";
import { parseXml } from "./utils";

export async function generateSteps(prompt: string): Promise<{steps: Step[], prompts: string[]}> {

  const response = await axios.post(`${BACKEND_URL}/template`, {
    prompt: prompt.trim(),
  });
  const { prompts, uiPrompts } = response.data;
  const steps = parseXml(uiPrompts[0], { groupInitialFiles: true });
  return {steps,prompts}
}
