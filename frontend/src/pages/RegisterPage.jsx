import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  cnic: "",
};

const RegisterPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[0-9]/.test(form.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1;
    if (score <= 1) return "Weak";
    if (score <= 3) return "Medium";
    return "Strong";
  }, [form.password]);

  const validate = (data) => {
    const nextErrors = {};
    if (!data.name.trim()) nextErrors.name = "Full Name is required";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) nextErrors.email = "Valid email is required";
    if (data.password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (data.password !== data.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (!/^03\d{2}-\d{7}$/.test(data.phone)) nextErrors.phone = "Phone format must be 03XX-XXXXXXX";
    if (!/^\d{5}-\d{7}-\d{1}$/.test(data.cnic)) nextErrors.cnic = "CNIC format must be #####-#######-#";
    return nextErrors;
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setErrors(validate(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        cnic: form.cnic,
      };
      const response = await api.post("/auth/register", payload);
      const token = response.data?.data?.token;
      const user = response.data?.data?.user;
      login(token, user);
      toast.success("Registered successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            {errors.email ? <p className="text-xs text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Strength: {passwordStrength}</p>
            {errors.password ? <p className="text-xs text-red-600">{errors.password}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
            {errors.confirmPassword ? <p className="text-xs text-red-600">{errors.confirmPassword}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone (03XX-XXXXXXX)</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
            {errors.phone ? <p className="text-xs text-red-600">{errors.phone}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">CNIC (#####-#######-#)</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.cnic}
              onChange={(e) => handleChange("cnic", e.target.value)}
            />
            {errors.cnic ? <p className="text-xs text-red-600">{errors.cnic}</p> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 mt-2 w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
