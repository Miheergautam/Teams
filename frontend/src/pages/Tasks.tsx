import { useEffect, useState } from "react";
import API from "../api/axios";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  _id: string;
  name: string;
  description: string;
  status: TaskStatus;
  project_id: string;
  created_by: string;
  assigned_to: string[];
  due_date?: string;
  created_at: string;
}

interface Project {
  _id: string;
  name: string;
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  const fetchProjects = async () => {
    try {
      const res = await API.get<Project[]>("/projects/users");
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProjectId(res.data[0]._id);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    }
  };

  const fetchTasks = async (projectId?: string) => {
    const project = projectId || selectedProjectId;
    if (!project) return;

    try {
      setLoading(true);
      setError(null);
      const res = await API.get<Task[]>(`/tasks/projects/${project}`);
      setTasks(res.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to load tasks";
      setError(message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!name.trim()) {
      setError("Task name is required");
      return;
    }

    if (!selectedProjectId) {
      setError("Please select a project");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await API.post(`/tasks/projects/${selectedProjectId}`, {
        name: name.trim(),
        description,
        assigned_to: [],
        due_date: dueDate || undefined,
      });

      setName("");
      setDescription("");
      setDueDate("");
      await fetchTasks();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create task";
      setError(message);
      console.error("Error creating task:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setError(null);
      await API.patch(`/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to update task";
      setError(message);
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      setError(null);
      await API.delete(`/tasks/${taskId}`);
      await fetchTasks();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to delete task";
      setError(message);
      console.error("Error deleting task:", err);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "DONE":
        return "bg-green-100 text-green-700 border-green-300";
    }
  };

  const getStatusButtonColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-200 hover:bg-gray-300";
      case "IN_PROGRESS":
        return "bg-blue-200 hover:bg-blue-300";
      case "DONE":
        return "bg-green-200 hover:bg-green-300";
    }
  };

  const filteredTasks =
    statusFilter === "ALL"
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Tasks</h1>

      {/* Project Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- No Project Selected --</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
        {projects.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            No projects found. Create a project first.
          </p>
        )}
      </div>

      {selectedProjectId && (
        <>
          {/* Create Task Form */}
          <div className="mb-8 bg-white p-6 shadow-md rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Create New Task
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <input
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
              />

              <textarea
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={2}
              />

              <input
                type="date"
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Due Date (optional)"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isCreating}
              />

              <button
                className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                  isCreating
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
                onClick={createTask}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex gap-2">
            {["ALL", "TODO", "IN_PROGRESS", "DONE"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as TaskStatus | "ALL")}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status === "ALL"
                  ? `All (${tasks.length})`
                  : `${status} (${tasks.filter((t) => t.status === status).length})`}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-lg">
                  No tasks{" "}
                  {statusFilter !== "ALL"
                    ? `with status "${statusFilter}"`
                    : "yet"}
                </p>
                <p className="text-gray-400">
                  {statusFilter === "ALL"
                    ? "Create your first task to get started"
                    : "Try a different filter"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">
                          {task.name}
                        </h3>
                        {task.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="ml-3 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                      {/* Status Badge */}
                      <div
                        className={`px-3 py-1 rounded-full border font-medium text-sm ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </div>

                      {/* Status Change Buttons */}
                      <div className="flex gap-2">
                        {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map(
                          (status) =>
                            status !== task.status && (
                              <button
                                key={status}
                                onClick={() =>
                                  updateTaskStatus(task._id, status)
                                }
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${getStatusButtonColor(status)}`}
                              >
                                Mark {status}
                              </button>
                            ),
                        )}
                      </div>

                      {/* Due Date */}
                      {task.due_date && (
                        <div className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Tasks;
