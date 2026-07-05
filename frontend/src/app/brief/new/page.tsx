"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ContentBriefCreate } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function NewBrief() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContentBriefCreate>({
    topic: "",
    primary_keyword: "",
    tone: "Professional",
    audience: "General",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const workflow = await api.createWorkflow(formData);
      // Start the workflow immediately
      await api.startWorkflow(workflow.id);
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create workflow.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl mt-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Create Content Brief</h1>
        <p className="text-muted-foreground text-lg">Define the topic and let the AI agents do the heavy lifting.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none">
        
        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 uppercase">Topic</label>
          <input 
            type="text" 
            required 
            className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:border-gray-400 dark:focus:ring-white/20 dark:focus:border-gray-500 transition-all"
            value={formData.topic}
            onChange={e => setFormData({...formData, topic: e.target.value})}
            placeholder="e.g. Best SEO Practices in 2024"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 uppercase">Primary Keyword</label>
          <input 
            type="text" 
            required 
            className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:border-gray-400 dark:focus:ring-white/20 dark:focus:border-gray-500 transition-all"
            value={formData.primary_keyword}
            onChange={e => setFormData({...formData, primary_keyword: e.target.value})}
            placeholder="e.g. SEO tips 2024"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 uppercase">Tone</label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:border-gray-400 dark:focus:ring-white/20 dark:focus:border-gray-500 transition-all"
              value={formData.tone}
              onChange={e => setFormData({...formData, tone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 uppercase">Audience</label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:border-gray-400 dark:focus:ring-white/20 dark:focus:border-gray-500 transition-all"
              value={formData.audience}
              onChange={e => setFormData({...formData, audience: e.target.value})}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-gray-200/50 dark:shadow-none mt-4">
          {loading ? "Initializing Agents..." : "Create Brief & Start AI Workflow"}
        </Button>
      </form>
    </div>
  );
}
