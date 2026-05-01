import { Outlet, useNavigate } from "react-router-dom";

function DashboardLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Teams</h2>

        <ul className="space-y-4">
          <li
            className="cursor-pointer hover:text-gray-300"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </li>

          <li
            className="cursor-pointer hover:text-gray-300"
            onClick={() => navigate("/dashboard/projects")}
          >
            Projects
          </li>

          <li
            className="cursor-pointer hover:text-gray-300"
            onClick={() => navigate("/dashboard/tasks")}
          >
            Tasks
          </li>
        </ul>
      </div>

      {/* Right Panel */}
      <div className="flex-1 p-6 bg-gray-100 overflow-auto">
        <Outlet /> 
      </div>
    </div>
  );
}

export default DashboardLayout;