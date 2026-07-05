"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Workflow } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkflows()
      .then(setWorkflows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">SEOFlow AI Dashboard</h1>
        <Link href="/brief/new">
          <Button>New Content Brief</Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading workflows...</p>
      ) : workflows.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50/50">
          <h2 className="text-xl text-gray-500">No workflows found. Create your first brief to get started!</h2>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`}>
              <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-white flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="font-semibold text-lg">Workflow #{wf.id}</h3>
                  <p className="text-sm text-gray-500">Status: {wf.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress: {wf.progress}%</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(wf.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
