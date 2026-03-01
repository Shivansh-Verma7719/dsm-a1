"use client";

import { useState } from "react";
import { Select, Label, ListBox } from "@heroui/react";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { ChartPlaceholders } from "@/components/dashboard/charts";
import { EventKPI } from "@/components/dashboard/event-kpi";

interface DashboardClientProps {
    events: any[];
    temporalAnalysis: any[];
    timeline: any[];
    nerAnalysis: Record<string, any>;
    sentimentAnalysis: any[];
    forgottenCrisis: any[];
    vulnerability: any[];
}

export function DashboardClient({
    events,
    temporalAnalysis,
    timeline,
    nerAnalysis,
    sentimentAnalysis,
    forgottenCrisis,
    vulnerability,
}: DashboardClientProps) {

    // Create a list of distinct events from the fetchEvents data
    const distinctEvents = events?.map(e => ({
        label: `${e.country} (${e.period})`,
        value: e.url,
    })) || [];

    const [selectedEventUrl, setSelectedEventUrl] = useState<string>(distinctEvents[0]?.value || "");

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-10 lg:p-14 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-red-500/80 font-sans">
                        Disaster Pulse
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-400 font-mono tracking-widest uppercase">
                        Intelligence Interface
                    </p>
                </div>

                {/* Global Event Selector */}
                <div className="w-full md:max-w-xs text-black">
                    <Select
                        aria-label="Select Disaster Event"
                        placeholder="Choose an event..."
                        className="w-full font-mono rounded-lg"
                        defaultSelectedKey={selectedEventUrl}
                        selectedKey={selectedEventUrl}
                        onSelectionChange={(key) => {
                            if (key && key !== selectedEventUrl) {
                                setSelectedEventUrl(key.toString());
                            }
                        }}
                    >
                        <Label className="sr-only">Select Disaster Event</Label>
                        <Select.Trigger>
                            <Select.Value />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox items={distinctEvents}>
                                {(evt) => (
                                    <ListBox.Item id={evt.value} textValue={evt.label} className="font-mono text-black">
                                        <Label>{evt.label}</Label>
                                    </ListBox.Item>
                                )}
                            </ListBox>
                        </Select.Popover>
                    </Select>
                </div>
            </header>

            <EventKPI selectedEventUrl={selectedEventUrl} events={events} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <ChartPlaceholders
                        selectedEventUrl={selectedEventUrl}
                        temporal={temporalAnalysis}
                        timeline={timeline}
                        vulnerability={vulnerability}
                        events={events}
                    />
                </div>
                <div className="space-y-8">
                    <InsightCards
                        selectedEventUrl={selectedEventUrl}
                        temporal={temporalAnalysis}
                        ner={nerAnalysis}
                        sentiment={sentimentAnalysis}
                        crisis={forgottenCrisis}
                        vulnerability={vulnerability}
                        events={events}
                    />
                </div>
            </div>

        </main>
    );
}
