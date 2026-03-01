import { Card } from "@heroui/react";
import { IconTerminal2 } from "@tabler/icons-react";

export function IntelligenceReport() {
    return (
        <Card className="bg-neutral-900/40 border border-neutral-800 backdrop-blur-md mt-12 w-full max-w-5xl mx-auto rounded-none border-l-4 border-l-red-500">
            <Card.Header className="flex gap-4 p-6 items-center border-b border-neutral-800/50 bg-neutral-950/50">
                <IconTerminal2 className="text-red-500 w-6 h-6" />
                <Card.Title className="text-2xl font-sans uppercase tracking-[0.2em] text-neutral-200">
                    Executive Summary
                </Card.Title>
            </Card.Header>

            <Card.Content className="p-8 space-y-8 font-mono text-neutral-300 leading-relaxed text-sm">
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest border-b border-red-500/20 pb-2 inline-block">
                        I. The Evolution of Response
                    </h3>
                    <p>
                        Analysis of the historical vs. modern disaster data reveals significant shifts in media velocity and humanitarian deployment. The system alert-to-media-peak delta has compressed considerably in recent years, driven by hyper-connected information networks. However, media focus does not always align symmetrically with vulnerability indices—often leaning towards alarmist coverage over analytical risk assessment.
                    </p>
                    <p>
                        In highly vulnerable regions (as measured by INFORM index), lower magnitude events occasionally receive disproportionate coverage if secondary risks align with geopolitical narratives, characterizing the "over-covered" phenomenon. Conversely, high-impact events in historically robust coping zones can slip into the "under-reported" category (The Forgotten Crisis).
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-orange-400 uppercase tracking-widest border-b border-orange-500/20 pb-2 inline-block">
                        II. Technical Extraction Challenges
                    </h3>
                    <ul className="list-disc pl-5 space-y-3 marker:text-orange-500">
                        <li>
                            <strong className="text-white">Dynamic Table Pagination & Layout:</strong> Extracting the "Impact" dataset from GDACS required multi-layered HTML traversal. The DOM structure shifts unpredictably between historical event pages and modern event pages, making static CSS selectors brittle.
                        </li>
                        <li>
                            <strong className="text-white">Noise in Asynchronous Tabs:</strong> The Media tab often loads asynchronously or relies on embedded widgets. Scraping social media mentions and article links necessitated robust waiting mechanisms (e.g., Selenium/Playwright waits) to ensure complete data availability before extraction.
                        </li>
                        <li>
                            <strong className="text-white">Data Normalization:</strong> Raw vulnerability scores often vary in scale and formatting constraint over a 10-year period. Aligning the legacy dataset with the modern dataset prior to injecting into the Pandas pipeline required intensive regex-based cleaning mechanisms.
                        </li>
                    </ul>
                </section>
            </Card.Content>
        </Card>
    );
}
