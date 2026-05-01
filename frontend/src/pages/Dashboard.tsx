import { useEffect, useState } from "react";
import API from "../api/axios";

interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  totalProjects: number;
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    todoTasks: 0,
    totalProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get<DashboardStats>("/dashboard/stats");
        setStats(res.data);
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to fetch stats";
        setError(message);
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-gray-500">Total Tasks</h2>
            <p className="text-3xl font-bold">{stats.totalTasks}</p>
          </div>

          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-gray-500">TODO Tasks</h2>
            <p className="text-3xl font-bold">{stats.todoTasks}</p>
          </div>

          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-gray-500">Projects</h2>
            <p className="text-3xl font-bold">{stats.totalProjects}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
