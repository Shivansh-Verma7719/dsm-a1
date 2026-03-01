import {
    fetchEvents,
    fetchTemporalAnalysis,
    fetchTimeline,
    fetchNerAnalysis,
    fetchSentimentAnalysis,
    fetchForgottenCrisis,
    fetchVulnerabilityBenchmark,
} from "./actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
    const [
        events,
        temporalAnalysis,
        timeline,
        nerAnalysis,
        sentimentAnalysis,
        forgottenCrisis,
        vulnerability,
    ] = await Promise.all([
        fetchEvents(),
        fetchTemporalAnalysis(),
        fetchTimeline(),
        fetchNerAnalysis(),
        fetchSentimentAnalysis(),
        fetchForgottenCrisis(),
        fetchVulnerabilityBenchmark(),
    ]);

    return (
        <DashboardClient
            events={events}
            temporalAnalysis={temporalAnalysis}
            timeline={timeline}
            nerAnalysis={nerAnalysis}
            sentimentAnalysis={sentimentAnalysis}
            forgottenCrisis={forgottenCrisis}
            vulnerability={vulnerability}
        />
    );
}
