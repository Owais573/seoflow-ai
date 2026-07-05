export const API_BASE_URL = "http://localhost:8000/api";

export interface ContentBriefCreate {
    topic: string;
    primary_keyword: string;
    secondary_keywords?: string;
    tone?: string;
    audience?: string;
    length?: string;
}

export interface Workflow {
    id: number;
    brief_id: number;
    status: string;
    current_step: string | null;
    progress: number;
    created_at: string;
    completed_at: string | null;
}

export const api = {
    async createWorkflow(data: ContentBriefCreate): Promise<Workflow> {
        const response = await fetch(`${API_BASE_URL}/workflows/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create workflow");
        return response.json();
    },

    async getWorkflows(): Promise<Workflow[]> {
        const response = await fetch(`${API_BASE_URL}/workflows/`);
        if (!response.ok) throw new Error("Failed to fetch workflows");
        return response.json();
    },

    async getWorkflow(id: number): Promise<Workflow> {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}`);
        if (!response.ok) throw new Error("Failed to fetch workflow");
        return response.json();
    },

    async getWorkflowState(id: number) {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}/state`);
        if (!response.ok) throw new Error("Failed to fetch workflow state");
        return response.json();
    },

    async deleteWorkflow(id: number) {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete workflow");
        return response.json();
    },

    async startWorkflow(id: number) {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}/start`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to start workflow");
        return response.json();
    },

    async approveWorkflow(id: number, data: any) {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to approve workflow");
        return response.json();
    }
};
