"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import CourtDetailClient from "./CourtDetailClient";

export default function CourtDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [court, setCourt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourt() {
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .eq("id", id)
        .single();

      if (data) setCourt(data);
      setLoading(false);
    }
    if (id) fetchCourt();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f5f2ed",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif", fontSize: 18, color: "#888" }}>
      Loading court…
    </div>
  );

  if (!court) return (
    <div style={{ minHeight: "100vh", background: "#f5f2ed",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif", fontSize: 18, color: "#888" }}>
      Court not found.
    </div>
  );

  return <CourtDetailClient court={court} />;
}