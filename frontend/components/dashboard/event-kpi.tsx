import { Card } from "@heroui/react";
import {
    IconAlertTriangle,
    IconActivity,
    IconUsers,
    IconShieldExclamation,
    IconNews,
    IconInfoCircle,
} from "@tabler/icons-react";

interface EventKPIProps {
    selectedEventUrl: string;
    events: any[];
}

export function EventKPI({ selectedEventUrl, events }: EventKPIProps) {
    if (!selectedEventUrl) return null;

    const event = events?.find(e => e.url === selectedEventUrl || e.url?.includes(selectedEventUrl));

    if (!event) return null;

    const kpis = [
        {
            title: "Magnitude",
            value: event.magnitude || "N/A",
            icon: <IconActivity className="w-5 h-5 text-red-500" />,
            info: "The physical strength or severity of the disaster (e.g., Richter scale for earthquakes).",
        },
        {
            title: "Alert Level",
            value: event.alert_level || "N/A",
            icon: <IconAlertTriangle className={`w-5 h-5 ${event.alert_level === 'Red' ? 'text-red-500' : event.alert_level === 'Orange' ? 'text-orange-500' : 'text-green-500'}`} />,
            info: "GDACS official alert level estimating potential humanitarian impact based on risk models.",
        },
        {
            title: "Population Exposed",
            value: event.population_clean ? event.population_clean.toLocaleString() : "N/A",
            subtitle: event.population_exposed,
            icon: <IconUsers className="w-5 h-5 text-blue-500" />,
            info: "Estimated number of people living within the immediate geographic impact zone.",
        },
        {
            title: "Vulnerability",
            value: event.vulnerability_clean || "N/A",
            icon: <IconShieldExclamation className="w-5 h-5 text-purple-500" />,
            info: "Socio-economic vulnerability score (INFORM Index); higher scores mean the country has less capacity to cope.",
        },
        {
            title: "Media Articles",
            value: event.articles_count || 0,
            icon: <IconNews className="w-5 h-5 text-neutral-400" />,
            info: "Total number of news articles collected and analyzed for this specific event parameter.",
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
            {kpis.map((kpi, i) => (
                <Card key={i} className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-md p-4 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute top-2 right-2 z-30 text-neutral-500 hover:text-white transition-colors cursor-help peer">
                        <IconInfoCircle size={16} />
                    </div>

                    <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md z-20 flex flex-col p-4 opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-300 items-center justify-center text-center">
                        <p className="text-[11px] text-neutral-300 font-mono leading-relaxed">{kpi.info}</p>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400 font-mono text-xs uppercase tracking-wider relative z-0">
                        {kpi.icon}
                        <span>{kpi.title}</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white mt-1 relative z-0">
                        {kpi.value}
                    </div>
                    {kpi.subtitle && (
                        <div className="text-[10px] items-center text-neutral-500 font-mono leading-tight mt-auto pt-2 border-t border-neutral-800 relative z-0">
                            {kpi.subtitle}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}
