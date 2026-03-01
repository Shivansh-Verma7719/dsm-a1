'use server';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function fetchTemporalAnalysis() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/temporal`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch temporal analysis');
    return res.json();
  } catch (error) {
    console.error('Error fetching temporal analysis:', error);
    return [];
  }
}

export async function fetchTimeline() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/timeline`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }
}

export async function fetchNerAnalysis() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/ner`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch NER analysis');
    return res.json();
  } catch (error) {
    console.error('Error fetching NER analysis:', error);
    return {};
  }
}

export async function fetchSentimentAnalysis() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/sentiment`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch sentiment analysis');
    return res.json();
  } catch (error) {
    console.error('Error fetching sentiment analysis:', error);
    return [];
  }
}

export async function fetchForgottenCrisis() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/forgotten-crisis`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch forgotten crisis');
    return res.json();
  } catch (error) {
    console.error('Error fetching forgotten crisis:', error);
    return [];
  }
}

export async function fetchVulnerabilityBenchmark() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/vulnerability`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch vulnerability benchmark');
    return res.json();
  } catch (error) {
    console.error('Error fetching vulnerability benchmark:', error);
    return [];
  }
}
