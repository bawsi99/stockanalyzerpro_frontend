import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import { DATABASE_ENDPOINTS } from "@/config";
import NewOutput from "./NewOutput";
import { Loader2, AlertTriangle } from "lucide-react";

const SharedAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "not_found">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) {
        setStatus("error");
        setMessage("Missing analysis id");
        return;
      }
      try {
        const resp = await fetch(`${DATABASE_ENDPOINTS.ANALYSIS_BY_ID}/${encodeURIComponent(id)}`);
        if (resp.status === 404) {
          setStatus("not_found");
          return;
        }
        if (!resp.ok) {
          throw new Error(`Failed to fetch analysis (${resp.status})`);
        }
        const data = await resp.json();
        // Expect shape: { success: true, analysis: { id, stock_symbol, analysis_data, ... } }
        const record = data?.analysis;
        if (!record || !record.analysis_data) {
          setStatus("not_found");
          return;
        }
        // Store in localStorage in the same format NewOutput expects
        const payload = {
          ...(record.analysis_data || {}),
          stock_symbol: record.stock_symbol || record.analysis_data?.stock_symbol || "",
        };
        try {
          localStorage.setItem("analysisResult", JSON.stringify(payload));
        } catch {}
        setStatus("ready");
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "Failed to load analysis");
      }
    };
    fetchAnalysis();
  }, [id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Loading analysis…</h1>
          <p className="text-slate-500">ID: {id}</p>
        </div>
      </div>
    );
  }

  if (status === "not_found" || status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-red-700 mb-2">
            {status === "not_found" ? "Analysis not found" : "Failed to load analysis"}
          </h1>
          {message && <p className="text-slate-600">{message}</p>}
        </div>
      </div>
    );
  }

  // Ready: render the same output UI using data from localStorage
  return <NewOutput />;
};

export default SharedAnalysis;