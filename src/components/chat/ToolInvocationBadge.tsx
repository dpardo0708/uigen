import { Loader2 } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  str_replace_editor: "Writing code",
  create_file: "Creating file",
  read_file: "Reading file",
  delete_file: "Deleting file",
};

interface ToolInvocationBadgeProps {
  toolName: string;
  state: string;
  result?: unknown;
}

export function ToolInvocationBadge({ toolName, state, result }: ToolInvocationBadgeProps) {
  const label = TOOL_LABELS[toolName] ?? toolName;
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}...</span>
        </>
      )}
    </div>
  );
}
