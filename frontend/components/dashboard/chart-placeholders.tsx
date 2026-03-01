import { Card, Select, ListBox, Label } from "@heroui/react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

interface ChartPlaceholdersProps {
    selectedEventUrl: string;
    temporal: any[];
    timeline: any[];
    vulnerability: any[];
    events: any[];
}

export function ChartPlaceholders({ selectedEventUrl, temporal, timeline, vulnerability, events }: ChartPlaceholdersProps) {
    const [compareEventUrl, setCompareEventUrl] = useState<string>("none");

    const radarData = useMemo(() => {
        let targetEvents = events || [];
        if (selectedEventUrl !== "all") {
            targetEvents = targetEvents.filter(e => e.url === selectedEventUrl || e.url?.includes(selectedEventUrl));
        }

        if (!targetEvents.length) return [];

        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

        const mags = targetEvents.map(e => e.magnitude_clean || 0);
        const vuln = targetEvents.map(e => e.vulnerability_clean || 0);
        const pop = targetEvents.map(e => Math.min(100, (e.population_clean || 0) / 100000));
        const media = targetEvents.map(e => Math.min(100, (e.articles_count || 0) / 10));
        const alerts = targetEvents.map(e => e.alert_level === 'Red' ? 100 : e.alert_level === 'Orange' ? 66 : 33);

        return [
            { subject: "Magnitude", score: avg(mags) * 10 },
            { subject: "Alert Level", score: avg(alerts) },
            { subject: "Vulnerability", score: avg(vuln) * 10 },
            { subject: "Exposure", score: avg(pop) },
            { subject: "Media Volume", score: avg(media) },
        ];
    }, [events, selectedEventUrl]);

    const timelineData = useMemo(() => {
        if (!timeline || !events || !selectedEventUrl) return [];

        const baseEvent = temporal?.find(t => t.event_url === selectedEventUrl);
        const compareEvent = compareEventUrl !== "none" ? temporal?.find(t => t.event_url === compareEventUrl) : null;

        const baseAlertDate = baseEvent?.system_alert ? new Date(baseEvent.system_alert) : null;
        const compareAlertDate = compareEvent?.system_alert ? new Date(compareEvent.system_alert) : null;

        const baseTimeline = timeline.filter(t => t.event_url === selectedEventUrl);
        const compTimeline = compareEventUrl !== "none" ? timeline.filter(t => t.event_url === compareEventUrl) : [];

        const map = new Map<number, any>();

        // Pre-fill continuous range so Recharts area strokes don't vanish on sparse intervals
        for (let i = -5; i <= 10; i++) {
            map.set(i, {
                relativeDay: `Day ${i > 0 ? '+' : ''}${i}`,
                dayIndex: i,
                primary: baseAlertDate ? 0 : null,
                secondary: compareAlertDate ? 0 : null
            });
        }

        const getRelativeDay = (dateStr: string, alertDateObj: Date) => {
            const tempDate = new Date(dateStr);
            let year = alertDateObj.getFullYear();

            if (tempDate.getMonth() < alertDateObj.getMonth() - 6) {
                year += 1;
            } else if (tempDate.getMonth() > alertDateObj.getMonth() + 6) {
                year -= 1;
            }

            tempDate.setFullYear(year);
            const diffMs = tempDate.getTime() - alertDateObj.getTime();
            return Math.round(diffMs / (1000 * 60 * 60 * 24));
        };

        if (baseAlertDate) {
            baseTimeline.forEach(t => {
                const day = getRelativeDay(t.date_dt, baseAlertDate);
                if (map.has(day)) map.get(day).primary += t.articles_count;
            });
        }

        if (compareAlertDate) {
            compTimeline.forEach(t => {
                const day = getRelativeDay(t.date_dt, compareAlertDate);
                if (map.has(day)) map.get(day).secondary += t.articles_count;
            });
        }

        return Array.from(map.values()).sort((a, b) => a.dayIndex - b.dayIndex);
    }, [timeline, events, temporal, selectedEventUrl, compareEventUrl]);

    const baseEventItem = events.find(e => e.url === selectedEventUrl);
    const compareEventItem = events.find(e => e.url === compareEventUrl);

    const chartConfigOverlay = {
        primary: { label: baseEventItem ? `${baseEventItem.country} (${baseEventItem.period})` : "Base Event", color: "#3b82f6" },
        secondary: { label: compareEventItem ? `${compareEventItem.country} (${compareEventItem.period})` : "Overlay Event", color: "#f97316" },
    };

    const chartConfigSingle = {
        primary: { label: baseEventItem ? `${baseEventItem.country} (${baseEventItem.period})` : "News Volume", color: "#3b82f6" },
    };

    const selectableEvents = events.filter(e => e.url !== selectedEventUrl).map(e => ({
        label: `${e.country} (${e.period})`,
        value: e.url,
    }));

    const chartConfigRadar = {
        score: { label: "Index Score", color: "#10b981" },
    };

    return (
        <div className="space-y-8">
            {/* Dual-Timeline Event Volatility */}
            {compareEventUrl !== "none" ? (
                <Card className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-md overflow-hidden relative group min-h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 z-0" />
                    <Card.Header className="relative z-10 px-6 pt-6 pb-2">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col">
                                <Card.Title className="text-xl font-sans tracking-wide">Evolution Timeline Overlay</Card.Title>
                                <Card.Description className="text-sm font-mono text-neutral-400 mt-1">
                                    Normalized Relative Days (System Alert = Day 0)
                                </Card.Description>
                            </div>
                            <div className="w-[300px] z-50">
                                <Select
                                    aria-label="Compare Event"
                                    className="mb-6"
                                    selectedKey={compareEventUrl}
                                    onSelectionChange={(key) => {
                                        if (key && key.toString() !== compareEventUrl) {
                                            setCompareEventUrl(key.toString());
                                        }
                                    }}
                                >
                                    <Select.Trigger>
                                        <Select.Value>{compareEventUrl === "none" ? "Compare with..." : selectableEvents.find(e => e.value === compareEventUrl)?.label || "Compare with..."}</Select.Value>
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox items={[{ label: "No Comparison", value: "none" }, ...selectableEvents]}>
                                            {(evt) => (
                                                <ListBox.Item id={evt.value} textValue={evt.label} className="font-mono text-black">
                                                    <Label>{evt.label}</Label>
                                                </ListBox.Item>
                                            )}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Content className="relative z-10 px-6 pb-6 h-[320px]">
                        <ChartContainer config={chartConfigOverlay} className="h-full w-full mt-4">
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis
                                    dataKey="dayIndex"
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tickFormatter={(value) => `Day ${value > 0 ? '+' : ''}${value}`}
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Area connectNulls type="monotone" dataKey="secondary" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorSecondary)" />
                                <Area connectNulls type="monotone" dataKey="primary" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorPrimary)" />
                            </AreaChart>
                        </ChartContainer>
                    </Card.Content>
                </Card>
            ) : (
                <Card className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-md overflow-hidden relative group min-h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 z-0" />
                    <Card.Header className="relative z-10 px-6 pt-6 pb-2">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col">
                                <Card.Title className="text-xl font-sans tracking-wide">Evolution Timeline</Card.Title>
                                <Card.Description className="text-sm font-mono text-neutral-400 mt-1">
                                    Normalized Relative Days (System Alert = Day 0)
                                </Card.Description>
                            </div>
                            <div className="w-[300px] z-50">
                                <Select
                                    aria-label="Compare Event"
                                    className="mb-6"
                                    selectedKey={compareEventUrl}
                                    onSelectionChange={(key) => {
                                        if (key && key.toString() !== compareEventUrl) {
                                            setCompareEventUrl(key.toString());
                                        }
                                    }}
                                >
                                    <Select.Trigger>
                                        <Select.Value>{compareEventUrl === "none" ? "Compare with..." : selectableEvents.find(e => e.value === compareEventUrl)?.label || "Compare with..."}</Select.Value>
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox items={[{ label: "No Comparison", value: "none" }, ...selectableEvents]}>
                                            {(evt) => (
                                                <ListBox.Item id={evt.value} textValue={evt.label} className="font-mono text-black">
                                                    <Label>{evt.label}</Label>
                                                </ListBox.Item>
                                            )}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Content className="relative z-10 px-6 pb-6 h-[320px]">
                        <ChartContainer config={chartConfigSingle} className="h-full w-full mt-4">
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPrimarySingle" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis
                                    dataKey="dayIndex"
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tickFormatter={(value) => `Day ${value > 0 ? '+' : ''}${value}`}
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area connectNulls type="monotone" dataKey="primary" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorPrimarySingle)" />
                            </AreaChart>
                        </ChartContainer>
                    </Card.Content>
                </Card>
            )}

            {/* Resilience Radar */}
            <Card className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-md overflow-hidden relative group min-h-[450px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-emerald-500/5 z-0" />
                <Card.Header className="relative z-10 px-6 pt-6 pb-2">
                    <div className="flex flex-col w-full text-center sm:text-left">
                        <Card.Title className="text-xl font-sans tracking-wide">Resilience Radar</Card.Title>
                        <Card.Description className="text-sm font-mono text-neutral-400">
                            Magnitude, Exposure, Media, and Vulnerability Normalized Index
                        </Card.Description>
                    </div>
                </Card.Header>
                <Card.Content className="relative z-10 p-6 flex items-center justify-center h-[350px]">
                    <ChartContainer config={chartConfigRadar} className="h-full w-[100%] max-w-[500px]">
                        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                            <PolarGrid stroke="#444" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Radar name="Index Score" dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.2} />
                        </RadarChart>
                    </ChartContainer>
                </Card.Content>
            </Card>
        </div>
    );
}
