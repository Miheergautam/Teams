import { useEffect, useState } from "react";
import API from "../api/axios";

interface Project {
  _id: string;
  name: string;
  description: string;
  created_by: string;
}

const MIN_PROJECT_NAME_LENGTH = 3;

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get<Project[]>("/projects/users");
      setProjects(res.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to load projects";
      setError(message);
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    if (trimmedName.length < MIN_PROJECT_NAME_LENGTH) {
      setError(
        `Project name must be at least ${MIN_PROJECT_NAME_LENGTH} characters`,
      );
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await API.post("/projects/", { name: trimmedName, description });
      setName("");
      setDescription("");
      await fetchProjects();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create project";
      setError(message);
      console.error("Error creating project:", err);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Projects</h1>

      {/* Create Project Form */}
      <div className="mb-8 bg-white p-6 shadow-md rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Create New Project
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Project Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
          />
          {name.trim().length > 0 &&
            name.trim().length < MIN_PROJECT_NAME_LENGTH && (
              <p className="text-xs text-red-600">
                Project name must be at least {MIN_PROJECT_NAME_LENGTH}{" "}
                characters
              </p>
            )}

          <textarea
            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isCreating}
            rows={3}
          />

          <button
            className={`w-full px-4 py-2 rounded font-medium transition-colors ${
              isCreating || name.trim().length < MIN_PROJECT_NAME_LENGTH
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            onClick={createProject}
            disabled={
              isCreating || name.trim().length < MIN_PROJECT_NAME_LENGTH
            }
          >
            {isCreating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No projects yet</p>
            <p className="text-gray-400">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-white p-5 shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {project.description || "No description"}
                </p>
                <div className="text-xs text-gray-400">
                  ID: {project._id.substring(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;
