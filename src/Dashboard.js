
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { format } from "date-fns";

// Replace with your real keys before deploying
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
      .order("due_date", { ascending: true });
    if (!error) setTasks(data);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[3]];
    const json = XLSX.utils.sheet_to_json(sheet);

    const cleaned = json
      .filter((row) => row["buildingName"] && row["taskSeq"])
      .map((row) => ({
        task_seq: String(row["taskSeq"]),
        school: row["buildingName"],
        description: row["longDescription"] || row["shortDescription"],
        due_date: new Date(row["taskDueDate"]).toISOString(),
        completed: false,
        created_at: new Date().toISOString(),
      }));

    const { error } = await supabase.from("tasks").upsert(cleaned, {
      onConflict: ["task_seq"],
    });

    if (!error) fetchTasks();
  };

  const filtered = tasks.filter((task) =>
    task.description?.toLowerCase().includes(search.toLowerCase()) ||
    task.school?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Maintenance Dashboard</h1>

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
                  <p className="text-sm text-muted-foreground">{task.school}</p>
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
