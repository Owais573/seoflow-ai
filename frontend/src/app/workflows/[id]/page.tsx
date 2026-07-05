"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Workflow, API_BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

export default function WorkflowDetails() {
  const params = useParams();
  const workflowId = params.id as string;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  
  // Review state
  const [workflowState, setWorkflowState] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

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

  useEffect(() => {
     if ((workflow?.status === "PENDING_REVIEW" || workflow?.status === "PUBLISHED") && !workflowState) {
         api.getWorkflowState(Number(workflowId)).then(state => {
             setWorkflowState(state);
             setEditTitle(state.seo_metadata?.title || "");
             setEditDesc(state.seo_metadata?.description || "");
             setEditContent(state.draft_content || "");
             setEditPrompt(state.media_prompt || "");
         }).catch(console.error);
     }
  }, [workflow?.status, workflowId, workflowState]);

  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    setStatusMsg("Publishing to WordPress...");
    try {
        let media_id = undefined;
        if (imageFile) {
            setStatusMsg("Uploading Image to WordPress...");
            const mediaResponse = await api.uploadImage(Number(workflowId), imageFile);
            media_id = mediaResponse.media_id;
        }

        setStatusMsg("Publishing to WordPress...");
        await api.approveWorkflow(Number(workflowId), {
            title: editTitle,
            meta_description: editDesc,
            content: editContent,
            media_prompt: editPrompt,
            media_id: media_id
        });
        
        // Re-open SSE stream to catch the publishing updates
        const eventSource = new EventSource(`${API_BASE_URL}/workflows/${workflowId}/stream`);
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setWorkflow(prev => prev ? {...prev, progress: data.progress, status: data.status, current_step: data.current_step} : prev);
            if (["PUBLISHED", "FAILED"].includes(data.status)) {
                eventSource.close();
                setApproving(false);
                if (data.status === "PUBLISHED") {
                    api.getWorkflowState(Number(workflowId)).then(setWorkflowState);
                }
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

        {workflow.status === "PUBLISHED" && workflowState?.published_url && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-green-800">Successfully Published!</h3>
                    <p className="text-sm text-green-700">Your article is live on WordPress.</p>
                </div>
                <a href={workflowState.published_url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        View Post <ExternalLink className="w-4 h-4" />
                    </Button>
                </a>
            </div>
        )}

        {workflow.status === "PENDING_REVIEW" && (
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">Action Required: Human Review</h3>
                <p className="mb-4">The AI agents have completed drafting your content and generated media prompts. Please review the output and provide final approval.</p>
                
                {workflowState ? (
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">SEO Title</label>
                            <input className="w-full border p-2 rounded" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Meta Description</label>
                            <textarea className="w-full border p-2 rounded" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Draft Content (Markdown/HTML)</label>
                            <textarea className="w-full border p-2 rounded font-mono text-sm" rows={10} value={editContent} onChange={e => setEditContent(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Featured Image Prompt</label>
                            <textarea className="w-full border p-2 rounded" rows={2} value={editPrompt} onChange={e => setEditPrompt(e.target.value)} />
                        </div>
                        <div className="bg-gray-50 p-4 rounded border">
                            <label className="block text-sm font-medium mb-1">Upload Featured Image (Optional)</label>
                            <p className="text-xs text-gray-500 mb-3">Use the prompt above to generate an image in Midjourney/DALL-E, then upload it here to be attached to your post.</p>
                            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm w-full" />
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 italic text-gray-500">Loading generated content for review...</div>
                )}

                <div className="flex space-x-4">
                    <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
                        {approving ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {statusMsg}
                            </div>
                        ) : "Approve & Publish"}
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Reject & Edit</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
