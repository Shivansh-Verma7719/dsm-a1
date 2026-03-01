"use client";

import { Card } from "@heroui/react";
import {
    IconClockHeart,
    IconBuildingHospital,
    IconMoodSearch,
    IconAlertCircle,
    IconShieldCheck,
    IconInfoCircle,
} from "@tabler/icons-react";

interface InsightCardsProps {
    selectedEventUrl: string;
    temporal: any[];
    ner: Record<string, any>;
    sentiment: any[];
    crisis: any[];
    vulnerability: any[];
    events: any[];
}

export function InsightCards({ selectedEventUrl, temporal, ner, sentiment, crisis, vulnerability, events }: InsightCardsProps) {

    // Helpers to get summary data
    const getAverageDelta = () => {
        if (!temporal || temporal.length === 0) return 0;

        let filtered = temporal;
        if (selectedEventUrl && selectedEventUrl !== "all") {
            // Some endpoints might return URL with trailing slashes differently or encode it, let's use exact match or fallback
            filtered = temporal.filter(t => t.event_url === selectedEventUrl || t.event_url.includes(selectedEventUrl));
        }

        if (filtered.length === 0) return 0;

        const sum = filtered.reduce((acc, curr) => acc + (curr.delta_days || 0), 0);
        return (sum / filtered.length).toFixed(1);
    };

    const getTopNGOs = () => {
        if (!ner || Object.keys(ner).length === 0) return [];
        const ngos = new Set<string>();

        if (selectedEventUrl && selectedEventUrl !== "all" && ner[selectedEventUrl]) {
            ner[selectedEventUrl].ngos_mentioned?.forEach((n: string) => ngos.add(n));
        } else {
            Object.values(ner).forEach((eventData: any) => {
                eventData.ngos_mentioned?.forEach((n: string) => ngos.add(n));
            });
        }
        return Array.from(ngos);
    };

    const currentCrisis = (selectedEventUrl && selectedEventUrl !== "all") ? crisis?.find(c => c.event_url === selectedEventUrl || c.event_url?.includes(selectedEventUrl)) : crisis?.[0];
    const currentSentiment = (selectedEventUrl && selectedEventUrl !== "all") ? sentiment?.find(s => s.event_url === selectedEventUrl || s.event_url?.includes(selectedEventUrl)) : sentiment?.[0];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-wider font-sans uppercase mb-4 opacity-80 border-b border-neutral-800 pb-2">
                Key Intelligence
            </h2>

            {/* Response Delta */}
            <Card className="bg-neutral-900/50 border border-neutral-800 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-3 right-3 z-30 text-neutral-500 hover:text-white transition-colors cursor-help peer">
                    <IconInfoCircle size={18} />
                </div>
                <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md z-20 flex flex-col p-6 opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-300 items-start justify-center">
                    <h3 className="text-white font-bold mb-2 font-sans tracking-wide">Response Delta</h3>
                    <p className="text-sm text-neutral-300 font-mono leading-relaxed">
                        Measures the time difference between the official system alert and peak media coverage.
                        <br /><br />
                        <span className="text-orange-400">Negative (-)</span> values mean media coverage spiked <i>before</i> the official alert was issued.
                    </p>
                </div>
                <Card.Header className="flex gap-3 pb-0 pt-4 px-4 items-center">
                    <IconClockHeart className="text-orange-500 w-8 h-8" />
                    <div className="flex flex-col">
                        <Card.Title className="text-lg font-bold font-sans">Response Delta</Card.Title>
                        <Card.Description className="text-xs font-mono text-neutral-400">System Alert to Media Peak</Card.Description>
                    </div>
                </Card.Header>
                <Card.Content className="py-4">
                    <div className="text-4xl font-mono text-white">{getAverageDelta()} <span className="text-xl text-neutral-500">Days</span></div>
                    <p className="text-sm text-neutral-400 mt-2 font-mono">{selectedEventUrl ? "Delay for this event" : "Average delay across events"}</p>
                </Card.Content>
            </Card>

            {/* Entity Recognition */}
            <Card className="bg-neutral-900/50 border border-neutral-800 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-3 right-3 z-30 text-neutral-500 hover:text-white transition-colors cursor-help peer">
                    <IconInfoCircle size={18} />
                </div>
                <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md z-20 flex flex-col p-6 opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-300 items-start justify-center">
                    <h3 className="text-white font-bold mb-2 font-sans tracking-wide">Active Entities</h3>
                    <p className="text-sm text-neutral-300 font-mono leading-relaxed">
                        Identifies major NGOs and government agencies mentioned heavily in the news coverage to track structural response.
                    </p>
                </div>
                <Card.Header className="flex gap-3 pb-0 pt-4 px-4 items-center">
                    <IconBuildingHospital className="text-green-500 w-8 h-8" />
                    <div className="flex flex-col">
                        <Card.Title className="text-lg font-bold font-sans">Active Entities</Card.Title>
                        <Card.Description className="text-xs font-mono text-neutral-400">NGOs & Agencies Identified</Card.Description>
                    </div>
                </Card.Header>
                <Card.Content className="py-4">
                    <div className="flex flex-wrap gap-2">
                        {getTopNGOs().map((ngo, i) => (
                            <span key={i} className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-mono uppercase tracking-wider border border-green-500/20">
                                {ngo}
                            </span>
                        ))}
                        {getTopNGOs().length === 0 && <span className="text-neutral-500 text-sm font-mono">No data</span>}
                    </div>
                </Card.Content>
            </Card>

            {/* Sentiment Volatility */}
            <Card className="bg-neutral-900/50 border border-neutral-800 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-3 right-3 z-30 text-neutral-500 hover:text-white transition-colors cursor-help peer">
                    <IconInfoCircle size={18} />
                </div>
                <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md z-20 flex flex-col p-6 opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-300 items-start justify-center">
                    <h3 className="text-white font-bold mb-2 font-sans tracking-wide">Media Tone</h3>
                    <p className="text-sm text-neutral-300 font-mono leading-relaxed">
                        Analyzes the overall sentiment of news articles. Polarity ranges from -1 (very negative) to 1 (very positive). Disasters typically run negative.
                    </p>
                </div>
                <Card.Header className="flex gap-3 pb-0 pt-4 px-4 items-center">
                    <IconMoodSearch className="text-blue-500 w-8 h-8" />
                    <div className="flex flex-col">
                        <Card.Title className="text-lg font-bold font-sans">Media Tone</Card.Title>
                        <Card.Description className="text-xs font-mono text-neutral-400">Sentiment Analysis</Card.Description>
                    </div>
                </Card.Header>
                <Card.Content className="py-4">
                    <div className="text-xl font-mono text-blue-400">{currentSentiment?.tone || "Analyzing..."}</div>
                    <p className="text-sm text-neutral-400 mt-2 font-mono">Polarity: {currentSentiment?.avg_polarity ?? "N/A"}</p>
                </Card.Content>
            </Card>

            {/* Forgotten Crisis Index */}
            <Card className="bg-neutral-900/50 border border-neutral-800 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-3 right-3 z-30 text-neutral-500 hover:text-white transition-colors cursor-help peer">
                    <IconInfoCircle size={18} />
                </div>
                <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md z-20 flex flex-col p-6 opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-300 items-start justify-center">
                    <h3 className="text-white font-bold mb-2 font-sans tracking-wide">Coverage Index</h3>
                    <p className="text-sm text-neutral-300 font-mono leading-relaxed">
                        Compares the volume of news coverage to the actual human impact (exposure, magnitude).
                        <br /><br />
                        <span className="text-purple-400">Under-reported</span> means the event has severe impact but disproportionately low media attention.
                    </p>
                </div>
                <Card.Header className="flex gap-3 pb-0 pt-4 px-4 items-center">
                    <IconAlertCircle className={currentCrisis?.status === "Over-covered" ? "text-red-500 w-8 h-8" : "text-purple-500 w-8 h-8"} />
                    <div className="flex flex-col">
                        <Card.Title className="text-lg font-bold font-sans">Coverage Index</Card.Title>
                        <Card.Description className="text-xs font-mono text-neutral-400">News Volume vs Impact</Card.Description>
                    </div>
                </Card.Header>
                <Card.Content className="py-4">
                    <div className="text-2xl font-mono text-white">{currentCrisis?.status || "Calculating..."}</div>
                    <p className="text-sm text-neutral-400 mt-2 font-mono">Index: {currentCrisis?.forgotten_crisis_index ?? "N/A"}</p>
                </Card.Content>
            </Card>

        </div>
    );
}
