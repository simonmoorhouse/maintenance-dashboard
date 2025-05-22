
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const SUPABASE_URL = "https://wamjsdcrpmemciquzfzr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbWpzZGNycG1lbWNpcXV6ZnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjE4NjcsImV4cCI6MjA2MzQ5Nzg2N30.2t7PUDS-D1sdIMfSf1S6g28U56UVGvfr8B7gre9IumQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ total: 0, overdue: 0, soon: 0 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("school", "Colne Valley HS")
      .order("due_date", { ascending: true });
    if (!error) {
      setTasks(data);
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);

      const overdue = data.filter(t => new Date(t.due_date) < now && !t.completed).length;
      const upcoming = data.filter(t => new Date(t.due_date) >= now && new Date(t.due_date) <= soon).length;

      setSummary({ total: data.length, overdue, soon: upcoming });

      const weekly = {};
      data.forEach(t => {
        const week = format(new Date(t.due_date), "dd MMM");
        weekly[week] = (weekly[week] || 0) + 1;
      });
      const chart = Object.entries(weekly).map(([date, count]) => ({ date, count }));
      setChartData(chart);
    }
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
      alert("No tasks found for Colne Valley HS.");
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
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Colne Valley HS Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Open Tasks</p><h2 className="text-2xl font-bold text-blue-600">{summary.total}</h2></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Overdue</p><h2 className="text-2xl font-bold text-red-600">{summary.overdue}</h2></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Due Soon (7 days)</p><h2 className="text-2xl font-bold text-yellow-500">{summary.soon}</h2></CardContent></Card>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Tasks by Due Date</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Input type="file" accept=".xlsx" onChange={handleFile} />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
