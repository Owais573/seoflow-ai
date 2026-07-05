"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Workflow } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    api.getWorkflows()
      .then(setWorkflows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setConfirmDeleteId(id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setConfirmDeleteId(null);
  };

  const executeDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await api.deleteWorkflow(id);
      setWorkflows(workflows.filter(wf => wf.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete workflow.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your AI-powered SEO content workflows.</p>
        </div>
        <Link href="/brief/new">
          <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white font-medium rounded-full px-6 transition-all hover:scale-105 shadow-md shadow-purple-500/20">
            + New Brief
          </Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading workflows...</p>
      ) : workflows.length === 0 ? (
        <div className="text-center p-16 border border-dashed border-gray-300 dark:border-white/20 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-2">No workflows found</h2>
          <p className="text-muted-foreground">Create your first brief to generate high-quality SEO content!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`}>
              <div className="p-6 border border-gray-200 dark:border-white/10 rounded-2xl hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/5 transition-all duration-300 bg-white/70 dark:bg-white/5 backdrop-blur-md flex flex-col justify-between h-full group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-xl mb-1 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-cyan-500 transition-all duration-300">
                      Workflow #{wf.id}
                    </h3>
                    <p className="text-xs text-muted-foreground">{new Date(wf.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    wf.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 
                    wf.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 
                    wf.status === 'FAILED' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {wf.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mt-auto">
                  <div className="w-full mr-6">
                    <div className="flex justify-between text-xs mb-1 font-medium text-muted-foreground">
                      <span>Progress</span>
                      <span>{wf.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${wf.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {confirmDeleteId === wf.id ? (
                    <div className="flex items-center gap-2 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20 shrink-0">
                      <Button variant="destructive" size="sm" onClick={(e) => executeDelete(e, wf.id)} className="h-7 text-xs rounded-lg font-bold">Yes</Button>
                      <Button variant="outline" size="sm" onClick={cancelDelete} className="h-7 text-xs rounded-lg bg-transparent border-red-500/30 hover:bg-red-500/20 text-red-600 dark:text-red-400">No</Button>
                    </div>
                  ) : deletingId === wf.id ? (
                    <div className="flex items-center justify-center w-9 h-9 shrink-0 text-purple-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={(e) => confirmDelete(e, wf.id)} className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-full z-10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
