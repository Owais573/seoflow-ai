"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Workflow, API_BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, ArrowLeft } from "lucide-react";

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
        
        if (data.status === "PENDING_REVIEW" || data.status === "FAILED" || (data.status === "PUBLISHED" && data.progress === 100)) {
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
            if (data.status === "FAILED" || (data.status === "PUBLISHED" && data.progress === 100)) {
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
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900 -ml-4 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
      
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
                        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 relative hover:bg-gray-50 transition-colors overflow-hidden">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => setImageFile(e.target.files?.[0] || null)} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                title=""
                            />
                            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                                {imageFile ? (
                                    <div className="flex flex-col items-center w-full">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={URL.createObjectURL(imageFile)} 
                                            alt="Preview" 
                                            className="max-h-64 object-contain rounded shadow-sm mb-4" 
                                        />
                                        <p className="text-sm font-medium text-blue-600 truncate max-w-xs">{imageFile.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Click or drag a new image to replace</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mx-auto w-12 h-12 mb-4 text-gray-300">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <label className="block text-base font-semibold text-gray-700 mb-1">Upload Featured Image (Optional)</label>
                                        <p className="text-sm text-gray-500">Drag and drop an image here, or click to select.</p>
                                        <p className="text-xs text-gray-400 mt-3 max-w-sm mx-auto">Use the prompt above to generate an image in Midjourney/DALL-E, then upload it here.</p>
                                    </div>
                                )}
                            </div>
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
