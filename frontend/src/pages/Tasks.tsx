import { ChangeEvent, useEffect, useState } from "react";
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

interface UserCandidate {
  _id: string;
  firstName?: string;
  lastName?: string | null;
  email?: string;
  role?: string;
}

interface ProjectMember {
  _id: string;
  user_id: string;
  project_id: string;
  role: string;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string | null;
    email?: string;
    role?: string;
  } | null;
}

const MIN_TASK_NAME_LENGTH = 3;

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [candidates, setCandidates] = useState<UserCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    [],
  );
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [pendingAssignees, setPendingAssignees] = useState<
    Record<string, string[]>
  >({});
  const [updatingAssigneesId, setUpdatingAssigneesId] = useState<string | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  const isCreateTaskValid = name.trim().length >= MIN_TASK_NAME_LENGTH;

  const getUserLabel = (user: UserCandidate) => {
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    if (user.email) return user.email;
    return user._id;
  };

  const getMemberLabel = (member: ProjectMember) => {
    const firstName = member.user?.firstName?.trim();
    const lastName = member.user?.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    if (member.user?.email) return member.user.email;
    return member.user_id;
  };

  const getAssigneeLabel = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    return member ? getMemberLabel(member) : userId;
  };

  const fetchProjects = async () => {
    try {
      const res = await API.get<Project[]>("/projects/users");
      setProjects(res.data);
      setSelectedProjectId((prev) => {
        if (res.data.length === 0) return "";
        if (!prev) return res.data[0]._id;
        return res.data.some((project) => project._id === prev)
          ? prev
          : res.data[0]._id;
      });
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    }
  };

  const fetchMembers = async (projectId?: string) => {
    const project = projectId || selectedProjectId;
    if (!project) {
      setMembers([]);
      return;
    }

    try {
      setMembersLoading(true);
      setMembersError(null);
      const res = await API.get<ProjectMember[]>(
        `/projects/${project}/members`,
      );
      setMembers(res.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to load members";
      setMembersError(message);
      setMembers([]);
      console.error("Error fetching members:", err);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchCandidates = async (projectId?: string) => {
    const project = projectId || selectedProjectId;
    if (!project) {
      setCandidates([]);
      return;
    }

    try {
      setCandidatesLoading(true);
      setCandidatesError(null);
      const res = await API.get<UserCandidate[]>(
        `/projects/${project}/member-candidates`,
      );
      setCandidates(res.data);
      setSelectedCandidateIds([]);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to load candidates";
      setCandidatesError(message);
      setCandidates([]);
      console.error("Error fetching candidates:", err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleCandidateSelection = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value,
    );
    setSelectedCandidateIds(selected);
  };

  const addMembers = async () => {
    if (!selectedProjectId) {
      setCandidatesError("Please select a project first");
      return;
    }

    if (selectedCandidateIds.length === 0) {
      setCandidatesError("Select at least one user to add");
      return;
    }

    try {
      setIsAddingMembers(true);
      setCandidatesError(null);
      await API.post(`/projects/${selectedProjectId}/add-members`, {
        user_ids: selectedCandidateIds,
        role: "MEMBER",
      });
      await fetchMembers(selectedProjectId);
      await fetchCandidates(selectedProjectId);
      setSelectedCandidateIds([]);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to add project members";
      setCandidatesError(message);
      console.error("Error adding members:", err);
    } finally {
      setIsAddingMembers(false);
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
      setPendingAssignees(
        Object.fromEntries(
          res.data.map((task) => [task._id, task.assigned_to]),
        ),
      );
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to load tasks";
      setError(message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Task name is required");
      return;
    }

    if (trimmedName.length < MIN_TASK_NAME_LENGTH) {
      setError(`Task name must be at least ${MIN_TASK_NAME_LENGTH} characters`);
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
        name: trimmedName,
        description,
        assigned_to: assignedTo,
        due_date: dueDate || undefined,
      });

      setName("");
      setDescription("");
      setDueDate("");
      setAssignedTo([]);
      await fetchTasks();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create task";
      setError(message);
      console.error("Error creating task:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssigneesChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value,
    );
    setAssignedTo(selected);
  };

  const handleTaskAssigneesChange = (
    taskId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value,
    );
    setPendingAssignees((prev) => ({ ...prev, [taskId]: selected }));
  };

  const areAssigneesEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
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

  const updateTaskAssignees = async (taskId: string, assignees: string[]) => {
    try {
      setUpdatingAssigneesId(taskId);
      setError(null);
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, assigned_to: assignees } : task,
        ),
      );
      await API.patch(`/tasks/${taskId}`, { assigned_to: assignees });
      await fetchTasks();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to update assignees";
      setError(message);
      console.error("Error updating assignees:", err);
    } finally {
      setUpdatingAssigneesId(null);
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
      fetchMembers(selectedProjectId);
      fetchCandidates(selectedProjectId);
      setAssignedTo([]);
      setPendingAssignees({});
      setSelectedCandidateIds([]);
      setCandidatesError(null);
    } else {
      setTasks([]);
      setMembers([]);
      setCandidates([]);
      setAssignedTo([]);
      setPendingAssignees({});
      setSelectedCandidateIds([]);
      setCandidatesError(null);
    }
  }, [selectedProjectId]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Tasks</h1>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

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
          {/* Project Members */}
          <div className="mb-8 bg-white p-6 shadow-md rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h2 className="text-xl font-semibold text-gray-800">
                People available for task assignment
              </h2>
              <button
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  candidatesLoading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => fetchCandidates(selectedProjectId)}
                disabled={candidatesLoading}
              >
                {candidatesLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Current Members
                </h3>
                {membersLoading ? (
                  <p className="text-sm text-gray-500">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No members found for this project
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li
                        key={member._id}
                        className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
                      >
                        <span className="text-sm text-gray-800">
                          {getMemberLabel(member)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {membersError && (
                  <p className="text-sm text-red-600 mt-2">{membersError}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Available Users
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Hold Cmd (Mac) or Ctrl (Windows) to select multiple users.
                </p>
                {candidatesError && (
                  <p className="text-sm text-red-600 mt-2">{candidatesError}</p>
                )}
                {candidatesLoading ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : candidates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No available users to add
                  </p>
                ) : (
                  <div className="space-y-3">
                    <select
                      multiple
                      value={selectedCandidateIds}
                      onChange={handleCandidateSelection}
                      className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {candidates.map((user) => (
                        <option key={user._id} value={user._id}>
                          {getUserLabel(user)}
                          {user.email ? ` (${user.email})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Selected: {selectedCandidateIds.length}
                      </span>
                      <button
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          isAddingMembers || selectedCandidateIds.length === 0
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                        onClick={addMembers}
                        disabled={
                          isAddingMembers || selectedCandidateIds.length === 0
                        }
                      >
                        {isAddingMembers ? "Adding..." : "Add Selected"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Create Task Form */}
          <div className="mb-8 bg-white p-6 shadow-md rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Create New Task
            </h2>

            <div className="space-y-3">
              <input
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
              />
              {name.trim().length > 0 &&
                name.trim().length < MIN_TASK_NAME_LENGTH && (
                  <p className="text-xs text-red-600">
                    Task name must be at least {MIN_TASK_NAME_LENGTH} characters
                  </p>
                )}

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

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Assign Members</label>
                <p className="text-xs text-gray-500">
                  Hold Cmd (Mac) or Ctrl (Windows) to select multiple members.
                </p>
                {membersLoading ? (
                  <p className="text-sm text-gray-500">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No members available for this project
                  </p>
                ) : (
                  <select
                    multiple
                    value={assignedTo}
                    onChange={handleAssigneesChange}
                    disabled={isCreating}
                    className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {members.map((member) => (
                      <option key={member._id} value={member.user_id}>
                        {getMemberLabel(member)}
                      </option>
                    ))}
                  </select>
                )}
                {membersError && (
                  <p className="text-sm text-red-600">{membersError}</p>
                )}
              </div>

              <button
                className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                  isCreating || !isCreateTaskValid
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
                onClick={createTask}
                disabled={isCreating || !isCreateTaskValid}
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

                      {/* Assigned Members */}
                      <div className="text-xs text-gray-500">
                        {task.assigned_to.length > 0
                          ? `Assigned: ${task.assigned_to
                              .map(getAssigneeLabel)
                              .join(", ")}`
                          : "Unassigned"}
                      </div>

                      {/* Due Date */}
                      {task.due_date && (
                        <div className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        Assign Members
                      </label>
                      {membersLoading ? (
                        <p className="text-xs text-gray-400">
                          Loading members...
                        </p>
                      ) : members.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No members available
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <select
                            multiple
                            value={
                              pendingAssignees[task._id] ?? task.assigned_to
                            }
                            onChange={(event) =>
                              handleTaskAssigneesChange(task._id, event)
                            }
                            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            disabled={updatingAssigneesId === task._id}
                          >
                            {members.map((member) => (
                              <option key={member._id} value={member.user_id}>
                                {getMemberLabel(member)}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-end">
                            <button
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                updatingAssigneesId === task._id ||
                                areAssigneesEqual(
                                  pendingAssignees[task._id] ??
                                    task.assigned_to,
                                  task.assigned_to,
                                )
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : "bg-blue-500 hover:bg-blue-600 text-white"
                              }`}
                              onClick={() =>
                                updateTaskAssignees(
                                  task._id,
                                  pendingAssignees[task._id] ??
                                    task.assigned_to,
                                )
                              }
                              disabled={
                                updatingAssigneesId === task._id ||
                                areAssigneesEqual(
                                  pendingAssignees[task._id] ??
                                    task.assigned_to,
                                  task.assigned_to,
                                )
                              }
                            >
                              {updatingAssigneesId === task._id
                                ? "Updating..."
                                : "Save Assignees"}
                            </button>
                          </div>
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
