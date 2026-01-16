"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";

interface AuthFile {
  id: string;
  name: string;
  provider: string;
  label?: string | null;
  status?: string | null;
  statusMessage?: string | null;
  disabled?: boolean | null;
  unavailable?: boolean | null;
  runtimeOnly?: boolean | null;
  source?: string | null;
  path?: string | null;
  size?: number | null;
  modtime?: string | null;
  email?: string | null;
  accountType?: string | null;
  account?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastRefresh?: string | null;
  successCount?: number | null;
  failureCount?: number | null;
}

interface AuthFilesResponse {
  running: boolean;
  files: AuthFile[];
  error: string | null;
  updatedAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini",
  "gemini-cli": "Gemini",
  qwen: "Qwen",
  iflow: "iFlow",
  vertex: "Vertex",
  antigravity: "Antigravity",
  copilot: "Copilot",
  codex: "Codex",
};

const formatLabel = (id: string) => PROVIDER_LABELS[id] ?? id;

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatSize = (bytes?: number | null) => {
  if (bytes === null || bytes === undefined) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const isDisabled = (file: AuthFile) =>
  typeof file.disabled === "boolean"
    ? file.disabled
    : file.status?.toLowerCase() === "disabled";

const getStatusMeta = (file: AuthFile) => {
  if (file.unavailable) {
    return { label: "Unavailable", tone: "badge-rose" };
  }
  if (isDisabled(file)) {
    return { label: "Disabled", tone: "badge-amber" };
  }
  const status = file.status?.toLowerCase();
  if (status === "error") {
    return { label: "Error", tone: "badge-rose" };
  }
  if (status === "ready") {
    return { label: "Ready", tone: "badge-emerald" };
  }
  if (status) {
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      tone: "badge-cyan",
    };
  }
  return { label: "Unknown", tone: "badge-cyan" };
};

const guessProvider = (filename: string) => {
  const lower = filename.toLowerCase();
  if (lower.includes("gemini")) return "gemini";
  if (lower.includes("claude")) return "claude";
  if (lower.includes("openai")) return "openai";
  if (lower.includes("codex")) return "codex";
  if (lower.includes("qwen")) return "qwen";
  if (lower.includes("iflow")) return "iflow";
  if (lower.includes("vertex")) return "vertex";
  if (lower.includes("antigravity")) return "antigravity";
  if (lower.includes("copilot")) return "copilot";
  return "claude";
};

export default function AuthFilesPage() {
  const [files, setFiles] = useState<AuthFile[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [provider, setProvider] = useState("claude");

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch("/api/proxy/auth-files", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load auth files");
      const json = (await response.json()) as AuthFilesResponse;
      setFiles(Array.isArray(json.files) ? json.files : []);
      setRunning(Boolean(json.running));
      setUpdatedAt(json.updatedAt ?? null);
      setError(json.error ?? null);
    } catch (err) {
      setRunning(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFile = useCallback(
    async (file: AuthFile) => {
      const target = file.id || file.name;
      if (!target) return;
      const nextDisabled = !isDisabled(file);
      setToggling((prev) => ({ ...prev, [target]: true }));
      try {
        const response = await fetch("/api/proxy/auth-files", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: target, disabled: nextDisabled }),
        });
        const json = await response.json().catch(() => null);
        if (!response.ok || json?.ok === false) {
          throw new Error(json?.error ?? "Failed to toggle auth file");
        }
        await load({ silent: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setToggling((prev) => {
          const next = { ...prev };
          delete next[target];
          return next;
        });
      }
    },
    [load],
  );

  const handleSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setSelectedFile(file);
      if (file) {
        setProvider(guessProvider(file.name));
      }
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("provider", provider);
      formData.append("file", selectedFile);
      formData.append("filename", selectedFile.name);
      const response = await fetch("/api/proxy/auth-files", {
        method: "POST",
        body: formData,
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.ok === false) {
        throw new Error(json?.error ?? "Upload failed");
      }
      setSelectedFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }, [load, provider, selectedFile]);

  const summaryText = useMemo(() => {
    if (!updatedAt) return "Last update unavailable";
    return `Last updated ${formatDate(updatedAt)}`;
  }, [updatedAt]);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-48 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.35),transparent_70%)] blur-2xl opacity-70 float-slow" />
        <div className="absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.3),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_70%)] blur-3xl opacity-60 float-fast" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.5)_0,transparent_55%)]" />
      </div>

      <div className="relative z-10 px-4 py-10 md:px-6 2xl:px-12">
        <div className="mx-auto w-full max-w-[1560px] space-y-6">
          <Card className="p-6">
            <SectionLabel>Auth Files</SectionLabel>
            <SectionTitle>Credentials vault</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Review provider auth files and toggle availability in real time.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span
                  className={`badge ${
                    running ? "badge-emerald" : "badge-rose"
                  } ${loading ? "shimmer" : ""}`}
                >
                  {loading ? "Checking" : running ? "Running" : "Offline"}
                </span>
                <span>{files.length} files</span>
                <span>{summaryText}</span>
              </div>
              <button
                className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 ${focusRing}`}
                type="button"
                onClick={() => load()}
              >
                Refresh
              </button>
            </div>
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </Card>

          <Card className="p-6">
            <SectionLabel>Upload</SectionLabel>
            <SectionTitle>Add auth file</SectionTitle>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-100"
                type="file"
                accept=".json,application/json"
                onChange={handleSelect}
              />
              <input
                className="h-10 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-200"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                placeholder="provider"
                list="provider-list"
              />
              <datalist id="provider-list">
                {Object.keys(PROVIDER_LABELS).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <button
                className={`inline-flex h-10 items-center rounded-full border border-white/10 bg-white/10 px-4 text-xs font-semibold text-slate-100 ${focusRing}`}
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {selectedFile ? (
              <p className="mt-2 text-xs text-slate-400">
                Selected: {selectedFile.name}
              </p>
            ) : null}
          </Card>

          {files.length === 0 && !loading ? (
            <Card className="p-6">
              <p className="text-sm text-slate-300">
                No auth files detected. Upload or sync files from CLIProxyAPI to
                see them here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-fade">
              {files.map((file) => {
                const statusMeta = getStatusMeta(file);
                const disabled = isDisabled(file);
                const fileKey = file.id || file.name;
                const providerLabel = formatLabel(file.provider);
                const displayName = file.label || file.name || file.id;
                const account = file.email || file.account || "Unknown";
                const lastUpdate =
                  file.lastRefresh || file.updatedAt || file.modtime || null;
                const busy = Boolean(toggling[fileKey]);

                return (
                  <Card
                    key={fileKey}
                    className={`p-5 hover-lift hover-gradient hover-glow ${disabled ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {providerLabel}
                          {providerLabel.toLowerCase() !==
                          file.provider?.toLowerCase()
                            ? ` (${file.provider})`
                            : ""}
                        </p>
                      </div>
                      <span className={`badge ${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {file.runtimeOnly ? (
                        <span className="chip chip-indigo text-[10px]">
                          Runtime
                        </span>
                      ) : null}
                      {file.source ? (
                        <span className="chip chip-cyan text-[10px]">
                          {file.source}
                        </span>
                      ) : null}
                      {file.unavailable ? (
                        <span className="chip chip-amber text-[10px]">
                          Unavailable
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Account</span>
                        <span className="text-slate-200">{account}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Updated</span>
                        <span className="text-slate-200">
                          {formatDate(lastUpdate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Size</span>
                        <span className="text-slate-200">
                          {formatSize(file.size)}
                        </span>
                      </div>
                    </div>

                    {file.statusMessage ? (
                      <p className="mt-3 text-xs text-rose-200">
                        {file.statusMessage}
                      </p>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {disabled ? "Disabled" : "Enabled"}
                      </span>
                      <button
                        className={`inline-flex h-8 items-center rounded-full border border-white/10 px-3 text-[11px] font-semibold text-slate-200 ${
                          disabled ? "bg-white/5" : "bg-white/10"
                        } ${focusRing}`}
                        type="button"
                        onClick={() => toggleFile(file)}
                        disabled={!running || busy}
                      >
                        {busy ? "Saving" : disabled ? "Enable" : "Disable"}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
