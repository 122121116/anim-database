import { API_BASE_URL } from './config.js';

export async function fetchAnimations() {
    const response = await fetch(`${API_BASE_URL}/animations`);
    if (!response.ok) throw new Error('Fetch failed');
    return await response.json();
}

export async function fetchAnimationDetail(aid) {
    const response = await fetch(`${API_BASE_URL}/animation/${aid}`);
    if (!response.ok) throw new Error('Fetch detail failed');
    return await response.json();
}
