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
    <div className="container mx-auto p-8 max-w-5xl mt-6">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Workflow #{workflow.id}</h1>
        <span className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${
            workflow.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
            workflow.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
            workflow.status === 'FAILED' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
        }`}>
            {workflow.status.replace("_", " ")}
        </span>
      </div>

      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl shadow-purple-500/5 space-y-8">
        <div>
            <div className="flex justify-between text-sm mb-3 font-semibold text-muted-foreground">
                <span className="animate-pulse">{workflow.current_step}</span>
                <span>{workflow.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-black/50 rounded-full h-4 overflow-hidden border border-gray-300/50 dark:border-white/5">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-700 ease-out relative" 
                  style={{ width: `${workflow.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
        </div>

        {workflow.status === "PUBLISHED" && workflowState?.published_url && (
            <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">Successfully Published!</h3>
                    <p className="text-green-600/80 dark:text-green-400/80">Your article is live on WordPress.</p>
                </div>
                <a href={workflowState.published_url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-6 rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-green-600/20">
                        View Post <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                </a>
            </div>
        )}

        {workflow.status === "PENDING_REVIEW" && (
            <div className="mt-10 p-8 bg-gray-50/50 dark:bg-[#0f0f11] border border-purple-500/20 rounded-2xl shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-400 mb-2">Human Review Required</h3>
                <p className="mb-8 text-muted-foreground text-lg">The AI agents have drafted the content. Please review and finalize the document below.</p>
                
                {workflowState ? (
                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">SEO Title</label>
                            <input className="w-full p-4 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-lg font-medium" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Meta Description</label>
                            <textarea className="w-full p-4 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Draft Content (Markdown)</label>
                            <textarea className="w-full p-6 bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all font-mono text-sm leading-relaxed shadow-inner" rows={14} value={editContent} onChange={e => setEditContent(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Generated Media Prompt</label>
                            <textarea className="w-full p-4 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all italic text-sm" rows={2} value={editPrompt} onChange={e => setEditPrompt(e.target.value)} />
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 relative hover:bg-gray-50 dark:hover:bg-purple-900/10 hover:border-purple-500/50 transition-all overflow-hidden group">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => setImageFile(e.target.files?.[0] || null)} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                title=""
                            />
                            <div className="p-10 text-center flex flex-col items-center justify-center min-h-[240px]">
                                {imageFile ? (
                                    <div className="flex flex-col items-center w-full relative z-20">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={URL.createObjectURL(imageFile)} 
                                            alt="Preview" 
                                            className="max-h-72 object-contain rounded-xl shadow-lg mb-6 ring-4 ring-white/10" 
                                        />
                                        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium truncate max-w-xs mb-2">
                                            {imageFile.name}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Click or drag a new image to replace</p>
                                    </div>
                                ) : (
                                    <div className="relative z-0 group-hover:scale-105 transition-transform duration-300">
                                        <div className="mx-auto w-16 h-16 mb-6 text-purple-500/50 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <label className="block text-lg font-bold text-foreground mb-2">Upload Featured Image</label>
                                        <p className="text-sm text-muted-foreground mb-4">Drag and drop your AI-generated image here</p>
                                        <span className="inline-block px-4 py-1.5 bg-gray-200 dark:bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">Browse Files</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 italic text-gray-500">Loading generated content for review...</div>
                )}

                <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                    <Button onClick={handleApprove} disabled={approving} className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/25">
                        {approving ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {statusMsg}
                            </div>
                        ) : "Approve & Publish"}
                    </Button>
                    <Button variant="outline" className="h-14 px-8 text-lg font-bold border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">Reject (Cancel)</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
