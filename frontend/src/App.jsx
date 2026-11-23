import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "https://datastaw-roster.onrender.com/api/employees";

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

  const [leaves, setLeaves] = useState([]);
  const [roster, setRoster] = useState(null);
  const [rosterMonth, setRosterMonth] = useState(new Date().getMonth() + 1);
  const [rosterYear, setRosterYear] = useState(new Date().getFullYear());

  const [leaveForm, setLeaveForm] = useState({
    employee: "",
    startDate: "",
    endDate: "",
    reason: "",
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

  const fetchLeaves = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/leaves");
      setLeaves(response.data);
    } catch (error) {
      console.log("Error fetching leaves:", error);
    }
  };

  const addLeave = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/leaves", leaveForm);

      setLeaveForm({
        employee: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      fetchLeaves();
      alert("Leave request submitted successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting leave");
    }
  };

  const updateLeaveStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status });
      fetchLeaves();
    } catch (error) {
      alert("Unable to update leave status");
    }
  };

  const deleteLeave = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/leaves/${id}`);
      fetchLeaves();
    } catch (error) {
      alert("Unable to delete leave");
    }
  };

  const generateRoster = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/rosters/generate",
        {
          month: Number(rosterMonth),
          year: Number(rosterYear),
        },
      );

      setRoster(response.data.roster);
      alert("Monthly roster generated successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Roster generation failed");
    }
  };

  const fetchRoster = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/rosters?month=${rosterMonth}&year=${rosterYear}`,
      );

      setRoster(response.data);
    } catch (error) {
      console.log(error);
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
    fetchLeaves();
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

      <div className="team-section">
        <h2>Leave Management</h2>

        <form onSubmit={addLeave} className="employee-form">
          <select
            value={leaveForm.employee}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, employee: e.target.value })
            }
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} - {emp.employeeId}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={leaveForm.startDate}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, startDate: e.target.value })
            }
            required
          />

          <input
            type="date"
            value={leaveForm.endDate}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, endDate: e.target.value })
            }
            required
          />

          <input
            placeholder="Leave Reason"
            value={leaveForm.reason}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, reason: e.target.value })
            }
            required
          />

          <button type="submit">Apply Leave</button>
        </form>

        <h3>All Leave Requests</h3>

        {leaves.map((leave) => (
          <div key={leave._id} className="team-card">
            <h4>{leave.employee?.name || "Employee"}</h4>
            <p>Start: {new Date(leave.startDate).toLocaleDateString()}</p>
            <p>End: {new Date(leave.endDate).toLocaleDateString()}</p>
            <p>Reason: {leave.reason}</p>
            <p>Status: {leave.status}</p>

            <button onClick={() => updateLeaveStatus(leave._id, "Approved")}>
              Approve
            </button>

            <button onClick={() => updateLeaveStatus(leave._id, "Rejected")}>
              Reject
            </button>

            <button onClick={() => deleteLeave(leave._id)}>Delete</button>
          </div>
        ))}
      </div>

      <div className="team-section">
        <h2>Monthly Roster Management</h2>

        <input
          type="number"
          min="1"
          max="12"
          value={rosterMonth}
          onChange={(e) => setRosterMonth(e.target.value)}
          placeholder="Month (1-12)"
        />

        <input
          type="number"
          value={rosterYear}
          onChange={(e) => setRosterYear(e.target.value)}
          placeholder="Year"
        />

        <button onClick={generateRoster}>Generate Monthly Roster</button>

        {roster?.assignments?.length > 0 && (
          <div>
            <h3>Generated Roster</h3>

            {roster.assignments.map((item, index) => (
              <div className="team-card" key={index}>
                <p>
                  Employee:{" "}
                  {item.employee?.name ||
                    employees.find((emp) => emp._id === item.employee)?.name ||
                    "Employee"}
                </p>
                <p>Date: {new Date(item.date).toLocaleDateString()}</p>
                <p>Shift: {item.shift}</p>
              </div>
            ))}
          </div>
        )}
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
