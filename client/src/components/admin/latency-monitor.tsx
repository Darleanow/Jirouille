"use client";
import { useMemo } from "react";
import type { LiveLatencyData } from "@/lib/api/monitoring";

type LatencyMonitorProps = {
    data: LiveLatencyData[];
};

export function LatencyMonitor({ data }: LatencyMonitorProps) {
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => b.lastLatencyMs - a.lastLatencyMs);
    }, [data]);

    if (sortedData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No active connections with latency data
            </div>
        );
    }

    const avgLatency =
        sortedData.reduce((sum, d) => sum + d.lastLatencyMs, 0) /
        sortedData.length;
    const maxLatency = Math.max(...sortedData.map((d) => d.lastLatencyMs));
    const minLatency = Math.min(...sortedData.map((d) => d.lastLatencyMs));

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Average</div>
                    <div className="text-2xl font-bold">
                        {Math.round(avgLatency)}ms
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Best</div>
                    <div className="text-2xl font-bold">{minLatency}ms</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Worst</div>
                    <div className="text-2xl font-bold">{maxLatency}ms</div>
                </div>
            </div>

            {/* Live Latency Bars */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Active Connections</h3>
                {sortedData.map((item) => {
                    const percentage = (item.lastLatencyMs / maxLatency) * 100;
                    const latencyColor =
                        item.lastLatencyMs < 50
                            ? "bg-green-500"
                            : item.lastLatencyMs < 100
                            ? "bg-yellow-500"
                            : item.lastLatencyMs < 200
                            ? "bg-orange-500"
                            : "bg-red-500";

                    return (
                        <div key={item.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                    {item.username || "Guest"}
                                    <span className="text-muted-foreground ml-2">
                                        ({item.id.slice(0, 8)}...)
                                    </span>
                                </span>
                                <span className="font-bold">
                                    {item.lastLatencyMs}ms
                                </span>
                            </div>
                            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${latencyColor} transition-all duration-300`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Latency Distribution */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">
                    Latency Distribution
                </h3>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>
                            &lt; 50ms:{" "}
                            {
                                sortedData.filter((d) => d.lastLatencyMs < 50)
                                    .length
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span>
                            50-100ms:{" "}
                            {
                                sortedData.filter(
                                    (d) =>
                                        d.lastLatencyMs >= 50 &&
                                        d.lastLatencyMs < 100
                                ).length
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span>
                            100-200ms:{" "}
                            {
                                sortedData.filter(
                                    (d) =>
                                        d.lastLatencyMs >= 100 &&
                                        d.lastLatencyMs < 200
                                ).length
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>
                            &gt; 200ms:{" "}
                            {
                                sortedData.filter((d) => d.lastLatencyMs >= 200)
                                    .length
                            }
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
