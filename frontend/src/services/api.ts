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

export interface WorkflowLog {
    id: number;
    agent: string;
    action: string;
    timestamp: string;
    workflow_id?: number; // for global stream
}

export interface AgentStat {
    name: string;
    avg_latency: number;
    max_latency: number;
    prompt_tokens: number;
    completion_tokens: number;
}

export interface MonitoringStats {
    throughput: {
        active: number;
        completed: number;
        failed: number;
        pending_review: number;
        total: number;
    };
    tokens: {
        prompt: number;
        completion: number;
    };
    avg_system_latency: number;
    agents: AgentStat[];
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

    async getWorkflowLogs(id: number): Promise<WorkflowLog[]> {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}/logs`);
        if (!response.ok) throw new Error("Failed to fetch workflow logs");
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

    async approveWorkflow(id: number, data: { title?: string, meta_description?: string, content?: string, media_prompt?: string, media_id?: number }) {
        const response = await fetch(`${API_BASE_URL}/workflows/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to approve workflow");
        return response.json();
    },

    async uploadImage(id: number, file: File) {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${API_BASE_URL}/workflows/${id}/upload-image`, {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) throw new Error("Failed to upload image");
        return response.json();
    },

    async getMonitoringStats(): Promise<MonitoringStats> {
        const response = await fetch(`${API_BASE_URL}/monitoring/stats`);
        if (!response.ok) throw new Error("Failed to fetch monitoring stats");
        return response.json();
    }
};
