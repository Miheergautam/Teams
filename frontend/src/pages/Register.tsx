import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { type RegisterRequest } from "../types/auth";
import { AxiosError } from "axios";

function Register(){
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string>("");

  const handleRegister = async () => {
    try {
      const res = await API.post<AuthResponse>("/auth/register", form);

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");

    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div>
      <h2>Register</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="First Name"
        value={form.firstName}
        onChange={(e) =>
          setForm({ ...form, firstName: e.target.value })
        }
      />

      <input
        placeholder="Last Name"
        value={form.lastName}
        onChange={(e) =>
          setForm({ ...form, lastName: e.target.value })
        }
      />

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <button onClick={handleRegister}>Register</button>

      <p onClick={() => navigate("/")}>
        Go to Login
      </p>
    </div>
  );
}

export default Register;