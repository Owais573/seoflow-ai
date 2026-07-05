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
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create Content Brief</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Topic</label>
          <input 
            type="text" 
            required 
            className="w-full p-2 border rounded-md"
            value={formData.topic}
            onChange={e => setFormData({...formData, topic: e.target.value})}
            placeholder="e.g. Best SEO Practices in 2024"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Keyword</label>
          <input 
            type="text" 
            required 
            className="w-full p-2 border rounded-md"
            value={formData.primary_keyword}
            onChange={e => setFormData({...formData, primary_keyword: e.target.value})}
            placeholder="e.g. SEO tips 2024"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={formData.tone}
              onChange={e => setFormData({...formData, tone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Audience</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={formData.audience}
              onChange={e => setFormData({...formData, audience: e.target.value})}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating Workflow..." : "Create Brief & Start AI Workflow"}
        </Button>
      </form>
    </div>
  );
}
