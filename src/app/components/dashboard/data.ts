export const navItems = [
  {
    label: "Dashboard",
    active: true,
    badge: "Live",
    badgeTone: "badge-emerald",
  },
  {
    label: "Providers",
    active: false,
    badge: "6",
    badgeTone: "badge-fuchsia",
  },
  {
    label: "API Keys",
    active: false,
    badge: "12",
    badgeTone: "badge-cyan",
  },
  {
    label: "Auth Files",
    active: false,
    badge: "4",
    badgeTone: "badge-indigo",
  },
  {
    label: "Logs",
    active: false,
    badge: "1.2M",
    badgeTone: "badge-amber",
  },
  {
    label: "Analytics",
    active: false,
    badge: "99%",
    badgeTone: "badge-rose",
  },
  { label: "Settings", active: false },
];

export const heroTags = [
  { label: "Provider Orchestration", tone: "chip-fuchsia" },
  { label: "Latency Guard", tone: "chip-cyan" },
  { label: "Zero Downtime", tone: "chip-emerald" },
];

export const kpis = [
  {
    label: "Total Requests",
    value: "1.24M",
    change: "+9.2%",
    hint: "last 7 days",
    tone: "text-cyan-300",
    surface: "from-cyan-950/70 via-slate-950/70 to-sky-950/70",
  },
  {
    label: "Success Rate",
    value: "99.18%",
    change: "+0.6%",
    hint: "rolling 24h",
    tone: "text-emerald-300",
    surface: "from-emerald-950/70 via-slate-950/70 to-lime-950/70",
  },
  {
    label: "Est. Cost",
    value: "$2,140",
    change: "-3.4%",
    hint: "monthly",
    tone: "text-amber-300",
    surface: "from-amber-950/70 via-slate-950/70 to-orange-950/70",
  },
];

export const setupSteps = [
  {
    title: "Start proxy",
    detail: "Enable the local CLIProxyAPI gateway",
    status: "done" as const,
  },
  {
    title: "Connect providers",
    detail: "Link OpenAI, Claude, Gemini, and Qwen",
    status: "active" as const,
  },
  {
    title: "Configure agents",
    detail: "Ship config to Cursor, Cline, or Claude Code",
    status: "pending" as const,
  },
];

export const providersConnected = [
  {
    name: "OpenAI",
    accounts: 3,
    status: "Healthy",
    statusTone: "badge-emerald",
    avatar: "from-cyan-500 to-blue-600",
  },
  {
    name: "Claude",
    accounts: 2,
    status: "Healthy",
    statusTone: "badge-emerald",
    avatar: "from-fuchsia-500 to-rose-500",
  },
  {
    name: "Gemini",
    accounts: 1,
    status: "Stable",
    statusTone: "badge-cyan",
    avatar: "from-indigo-500 to-purple-600",
  },
  {
    name: "Qwen",
    accounts: 1,
    status: "Watching",
    statusTone: "badge-amber",
    avatar: "from-amber-500 to-orange-500",
  },
];

export const providersAvailable = ["Vertex", "Antigravity", "iFlow", "Custom"];

export const requestLogs = [
  {
    id: "req-9012",
    route: "/v1/chat/completions",
    model: "gpt-4.1",
    provider: "OpenAI",
    latency: "289ms",
    tokens: "1.2k",
    status: "200 OK",
    tone: "badge-emerald",
  },
  {
    id: "req-9011",
    route: "/v1/messages",
    model: "claude-3.7-sonnet",
    provider: "Claude",
    latency: "412ms",
    tokens: "980",
    status: "200 OK",
    tone: "badge-emerald",
  },
  {
    id: "req-9010",
    route: "/v1/chat/completions",
    model: "gemini-1.5-pro",
    provider: "Gemini",
    latency: "620ms",
    tokens: "1.7k",
    status: "429 Retry",
    tone: "badge-amber",
  },
  {
    id: "req-9009",
    route: "/v1/chat/completions",
    model: "qwen-2.5",
    provider: "Qwen",
    latency: "510ms",
    tokens: "760",
    status: "200 OK",
    tone: "badge-emerald",
  },
];

export const proxyPools = [
  {
    name: "EdgePool · US-East",
    protocol: "HTTP / SOCKS5",
    ips: "240 IPs",
    latency: "28ms",
    success: "99.6%",
    status: "Healthy",
    statusTone: "badge-emerald",
  },
  {
    name: "PulseGate · EU-West",
    protocol: "HTTP",
    ips: "164 IPs",
    latency: "42ms",
    success: "98.9%",
    status: "Stable",
    statusTone: "badge-cyan",
  },
  {
    name: "OrbitMesh · APAC",
    protocol: "SOCKS5",
    ips: "120 IPs",
    latency: "56ms",
    success: "97.4%",
    status: "Watch",
    statusTone: "badge-amber",
  },
  {
    name: "SignalRoute · LatAm",
    protocol: "HTTP",
    ips: "84 IPs",
    latency: "61ms",
    success: "95.2%",
    status: "Degraded",
    statusTone: "badge-rose",
  },
];

export const policies = [
  {
    title: "Latency shield",
    detail: "Auto-reroute when p95 exceeds 65ms.",
    status: "Live",
    tone: "badge-emerald",
  },
  {
    title: "Geo-fencing",
    detail: "Lock sensitive pools to EU + US only.",
    status: "Scheduled",
    tone: "badge-cyan",
  },
  {
    title: "Cost guardrail",
    detail: "Throttle burst traffic over 3.1 TB/day.",
    status: "Review",
    tone: "badge-amber",
  },
];

export const quickLinks = [
  {
    title: "Providers",
    detail: "Connect and monitor provider health",
    href: "/providers",
    statKey: "connectedProviders",
    suffix: "connected",
    tone: "badge-fuchsia",
  },
  {
    title: "Models",
    detail: "Browse available model list",
    href: "/models",
    badge: "Browse",
    tone: "badge-indigo",
  },
  {
    title: "Provider Keys",
    detail: "Manage provider credentials",
    href: "/api-keys",
    statKey: "apiKeysCount",
    suffix: "keys",
    tone: "badge-cyan",
  },
  {
    title: "Client Keys",
    detail: "Generate internal access keys",
    href: "/client-keys",
    statKey: "clientKeysCount",
    suffix: "keys",
    tone: "badge-emerald",
  },
  {
    title: "Auth Files",
    detail: "Sync auth files from CLIProxyAPI",
    href: "/auth-files",
    statKey: "authFilesCount",
    suffix: "files",
    tone: "badge-indigo",
  },
  {
    title: "Logs",
    detail: "Trace requests and errors",
    href: "/logs",
    statKey: "logsCount",
    suffix: "lines",
    tone: "badge-amber",
  },
];
