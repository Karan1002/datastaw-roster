import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/employees";

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    brand: "",
    process: "",
    pod: "",
    role: "Employee",
  });

  const [teams, setTeams] = useState([]);

  const [teamForm, setTeamForm] = useState({
    teamName: "",
    teamLeader: "",
    brand: "",
    process: "",
  });

  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API);
      setEmployees(res.data);
    } catch (error) {
      setMessage("Unable to load employees");
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/teams");
      setTeams(response.data);
    } catch (error) {
      console.log("Error fetching teams:", error);
    }
  };

  const addTeam = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/teams", teamForm);

      setTeamForm({
        teamName: "",
        teamLeader: "",
        brand: "",
        process: "",
      });

      fetchTeams();
      alert("Team created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error creating team");
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/teams/${id}`);
      fetchTeams();
      alert("Team deleted successfully!");
    } catch (error) {
      alert("Error deleting team");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addEmployee = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, form);
        setMessage("Employee updated successfully!");
      } else {
        await axios.post(API, form);
        setMessage("Employee added successfully!");
      }

      setEditId(null);

      setForm({
        employeeId: "",
        name: "",
        email: "",
        phone: "",
        brand: "",
        process: "",
        pod: "",
        role: "Employee",
      });

      fetchEmployees();
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
    }
  };

  const editEmployee = (emp) => {
    setEditId(emp._id);

    setForm({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      brand: emp.brand,
      process: emp.process,
      pod: emp.pod || "",
      role: emp.role || "Employee",
    });
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      setMessage("Employee deleted successfully!");
      fetchEmployees();
    } catch (error) {
      setMessage("Unable to delete employee");
    }
  };

  return (
    <div className="app">
      <header>
        <h1>DataStraw</h1>
        <p>Smart Roster Management System</p>
      </header>

      <div className="team-section">
        <h2>Team Management</h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addTeam(e);
          }}
          className="employee-form"
        >
          <input
            type="text"
            placeholder="Team Name"
            value={teamForm.teamName}
            onChange={(e) =>
              setTeamForm({ ...teamForm, teamName: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Team Leader"
            value={teamForm.teamLeader}
            onChange={(e) =>
              setTeamForm({ ...teamForm, teamLeader: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Brand"
            value={teamForm.brand}
            onChange={(e) =>
              setTeamForm({ ...teamForm, brand: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Process"
            value={teamForm.process}
            onChange={(e) =>
              setTeamForm({ ...teamForm, process: e.target.value })
            }
            required
          />

          <button type="submit">Create Team</button>
        </form>
        <div className="team-list">
          <h3>All Teams</h3>

          {teams.map((team) => (
            <div key={team._id} className="team-card">
              <h4>{team.teamName}</h4>
              <p>Team Leader: {team.teamLeader}</p>
              <p>Brand: {team.brand}</p>
              <p>Process: {team.process}</p>

              <button onClick={() => deleteTeam(team._id)}>Delete Team</button>
            </div>
          ))}
        </div>
      </div>

      <main>
        <h2>Employee Management</h2>

        <form onSubmit={addEmployee} className="employee-form">
          <input
            name="employeeId"
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={handleChange}
            required
          />
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
          />
          <input
            name="brand"
            placeholder="Brand"
            value={form.brand}
            onChange={handleChange}
            required
          />
          <input
            name="process"
            placeholder="Process"
            value={form.process}
            onChange={handleChange}
            required
          />
          <input
            name="pod"
            placeholder="Pod"
            value={form.pod}
            onChange={handleChange}
          />
          <button type="submit">
            {editId ? "Update Employee" : "Add Employee"}
          </button>
        </form>

        {message && <p>{message}</p>}

        <h2>Employees ({employees.length})</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Brand</th>
                <th>Process</th>
                <th>Pod</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.brand}</td>
                  <td>{emp.process}</td>
                  <td>{emp.pod}</td>
                  <td>{emp.status}</td>
                  <td>
                    <button onClick={() => editEmployee(emp)}>Edit</button>{" "}
                    <button onClick={() => deleteEmployee(emp._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
