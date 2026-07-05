"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api, MonitoringStats, WorkflowLog, API_BASE_URL } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Cpu, Clock, Users, Terminal, AlertCircle, ArrowLeft } from "lucide-react";

export default function MonitoringDashboard() {
    const [stats, setStats] = useState<MonitoringStats | null>(null);
    const [logs, setLogs] = useState<WorkflowLog[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getMonitoringStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch monitoring stats", err);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    // Global SSE Stream
    useEffect(() => {
        const eventSource = new EventSource(`${API_BASE_URL}/monitoring/stream`);

        eventSource.addEventListener("log", (e) => {
            const newLog = JSON.parse(e.data) as WorkflowLog;
            setLogs((prev) => [...prev, newLog]);
        });

        eventSource.onerror = (err) => {
            console.error("Monitoring SSE Error", err);
        };

        return () => eventSource.close();
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    if (!stats) {
        return (
            <div className="container mx-auto max-w-6xl py-12 px-6 flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl py-8 px-6">
            <div className="mb-6">
                <Link href="/">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4 flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>
            
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">System Observability</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Real-time workflow metrics and global telemetry.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card className="bg-white dark:bg-[#0a0a0b] border-gray-200 dark:border-white/10 shadow-sm rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Streams</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.throughput.active}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Workflows: {stats.throughput.total}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#0a0a0b] border-gray-200 dark:border-white/10 shadow-sm rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token Burn Rate</CardTitle>
                        <Cpu className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {(stats.tokens.prompt + stats.tokens.completion).toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">↑ {stats.tokens.prompt.toLocaleString()} IN | ↓ {stats.tokens.completion.toLocaleString()} OUT</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#0a0a0b] border-gray-200 dark:border-white/10 shadow-sm rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Latency</CardTitle>
                        <Clock className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avg_system_latency}s</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg total workflow execution</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#0a0a0b] border-gray-200 dark:border-white/10 shadow-sm rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Human Pipeline</CardTitle>
                        <Users className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.throughput.pending_review}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Workflows pending review</p>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Efficiency Table */}
            <div className="mb-10">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Agent Efficiency Breakdown</h2>
                <div className="bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4 uppercase tracking-wider">Agent Node</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Avg Latency</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Max Latency</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Total Tokens</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {stats.agents.map((agent) => {
                                const isAnomaly = agent.max_latency > agent.avg_latency * 3 && agent.avg_latency > 0;
                                return (
                                    <tr key={agent.name} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{agent.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{agent.avg_latency}s</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{agent.max_latency}s</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {(agent.prompt_tokens + agent.completion_tokens).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isAnomaly ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <AlertCircle className="w-3 h-3" /> Spike Detected
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    Optimal
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {stats.agents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No agent execution data available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Live Stream Terminal */}
            <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-gray-500" /> Global Log Stream
                </h2>
                <div className="bg-gray-100 dark:bg-[#0a0a0b] border border-gray-300 dark:border-white/10 rounded-2xl overflow-hidden shadow-inner flex flex-col h-96">
                    <div className="bg-gray-200 dark:bg-white/10 px-4 py-2 border-b border-gray-300 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Live Telemetry</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 font-mono text-sm leading-relaxed space-y-2">
                        {logs.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-500 text-center mt-10">Listening for global events...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="text-gray-800 dark:text-gray-300">
                                    <span className="text-gray-500 dark:text-gray-500">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                    </span>{" "}
                                    <span className="text-purple-600 dark:text-purple-400">
                                        [WF#{log.workflow_id}]
                                    </span>{" "}
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                        [{log.agent}]
                                    </span>{" "}
                                    {log.action}
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}
