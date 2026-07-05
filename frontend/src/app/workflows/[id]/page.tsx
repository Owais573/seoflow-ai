"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Workflow, API_BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function WorkflowDetails() {
  const params = useParams();
  const workflowId = params.id as string;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    // Fetch initial workflow details
    api.getWorkflow(Number(workflowId)).then(setWorkflow).catch(console.error);

    // Setup SSE for real-time progress
    const eventSource = new EventSource(`${API_BASE_URL}/workflows/${workflowId}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setWorkflow(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            progress: data.progress,
            status: data.status,
            current_step: data.current_step
          };
        });
        
        if (["PENDING_REVIEW", "PUBLISHED", "FAILED"].includes(data.status)) {
            eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE event", err);
      }
    };
    
    eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        eventSource.close();
    };

    return () => eventSource.close();
  }, [workflowId]);

  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
        await api.approveWorkflow(Number(workflowId), {
            // For MVP, we send empty edits (accepting AI defaults)
            title: "",
            meta_description: "",
            content: "",
            media_prompt: ""
        });
        // The SSE stream should technically have been closed, but if we resume it or poll, we can get updates.
        // For MVP, we'll just alert and let the SSE stream (if still open) or manual refresh catch it.
        alert("Workflow approved! Publishing to WordPress...");
        
        // Re-open SSE stream to catch the publishing updates
        const eventSource = new EventSource(`${API_BASE_URL}/workflows/${workflowId}/stream`);
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setWorkflow(prev => prev ? {...prev, progress: data.progress, status: data.status, current_step: data.current_step} : prev);
            if (["PUBLISHED", "FAILED"].includes(data.status)) {
                eventSource.close();
                setApproving(false);
            }
        };
    } catch (err) {
        console.error(err);
        alert("Failed to approve workflow.");
        setApproving(false);
    }
  };

  if (!workflow) return <div className="p-8">Loading workflow...</div>;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workflow #{workflow.id}</h1>
        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
            workflow.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
            workflow.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
            workflow.status === 'FAILED' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
        }`}>
            {workflow.status.replace("_", " ")}
        </span>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
        <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Progress: {workflow.current_step}</span>
                <span>{workflow.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${workflow.progress}%` }}></div>
            </div>
        </div>

        {workflow.status === "PENDING_REVIEW" && (
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">Action Required: Human Review</h3>
                <p className="mb-4">The AI agents have completed drafting your content and generated media prompts. Please review the output and provide final approval.</p>
                <div className="flex space-x-4">
                    <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
                        {approving ? "Publishing..." : "Approve & Publish"}
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Reject & Edit</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
