
import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { format } from "date-fns";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const sample = [
      {
        taskSeq: "4232743",
        school: "Colne Valley High School",
        description: "Replace fire alarm batteries",
        dueDate: "2025-05-08",
      },
      {
        taskSeq: "4095162",
        school: "Colne Valley High School",
        description: "Remove Ragwort from field",
        dueDate: "2024-11-01",
      },
    ];
    setTasks(sample);
  }, []);

  useEffect(() => {
    setFiltered(
      tasks
        .filter(
          (task) =>
            task.description.toLowerCase().includes(search.toLowerCase()) ||
            task.school.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    );
  }, [search, tasks]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Maintenance Dashboard</h1>

      <div className="mb-4">
        <Input
          placeholder="Search by school or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.map((task) => {
        const isOverdue = new Date(task.dueDate) < new Date();
        return (
          <Card key={task.taskSeq} className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{task.school}</p>
                  <h2 className="text-lg font-semibold">{task.description}</h2>
                  <p className={isOverdue ? "text-red-600 font-semibold" : ""}>
                    Due: {format(new Date(task.dueDate), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="text-sm text-gray-500">#{task.taskSeq}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
