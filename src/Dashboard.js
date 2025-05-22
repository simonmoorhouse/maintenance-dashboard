
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { format } from "date-fns";

const SUPABASE_URL = "https://wamjsdcrpmemciquzfzr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbWpzZGNycG1lbWNpcXV6ZnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjE4NjcsImV4cCI6MjA2MzQ5Nzg2N30.2t7PUDS-D1sdIMfSf1S6g28U56UVGvfr8B7gre9IumQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("school", "Colne Valley HS")
      .order("due_date", { ascending: true });
    if (!error) setTasks(data);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    let targetSheet;
    for (const name of workbook.SheetNames) {
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
      const headers = sheet[0].map(h => h.toString().trim().toLowerCase());
      if (headers.includes("buildingname") && headers.includes("taskseq")) {
        targetSheet = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        break;
      }
    }

    if (!targetSheet) {
      alert("Could not find a sheet with the expected columns.");
      return;
    }

    const filtered = targetSheet.filter(
      (row) => row["buildingName"]?.trim() === "Colne Valley HS"
    );

    if (filtered.length === 0) {
      alert("No tasks found for Colne Valley High School.");
      return;
    }

    const cleaned = filtered.map((row) => ({
      task_seq: String(row["taskSeq"]),
      school: row["buildingName"],
      description: row["longDescription"] || row["shortDescription"] || "No description",
      due_date: new Date(row["taskDueDate"]).toISOString(),
      completed: false,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("tasks").upsert(cleaned, {
      onConflict: ["task_seq"],
    });

    if (error) {
      alert("Error uploading tasks: " + error.message);
    } else {
      alert("Tasks uploaded successfully.");
      fetchTasks();
    }
  };

  const filtered = tasks.filter((task) =>
    task.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Colne Valley Dashboard</h1>

      <Input type="file" accept=".xlsx" onChange={handleFile} className="mb-4" />
      <Input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {filtered.map((task) => {
        const isOverdue = new Date(task.due_date) < new Date() && !task.completed;
        return (
          <Card key={task.task_seq} className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{task.description}</h2>
                  <p className={isOverdue ? "text-red-600 font-semibold" : ""}>
                    Due: {format(new Date(task.due_date), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="text-sm text-gray-500">#{task.task_seq}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
