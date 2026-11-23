import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const BASE = "https://datastaw-roster.onrender.com/api";
const API = `${BASE}/employees`;

const EMPTY_EMP = {
  employeeId: "",
  name: "",
  email: "",
  phone: "",
  brand: "",
  process: "",
  pod: "",
  role: "Employee",
};
const EMPTY_LEAVE = { employee: "", startDate: "", endDate: "", reason: "" };
const EMPTY_TEAM = { teamName: "", teamLeader: "", brand: "", process: "" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "employees", label: "Employees" },
  { id: "teams", label: "Teams" },
  { id: "leaves", label: "Leaves" },
  { id: "roster", label: "Roster" },
];

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const initials = (name = "") =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function App() {
  const [tab, setTab] = useState("overview");
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [roster, setRoster] = useState(null);

  const [form, setForm] = useState(EMPTY_EMP);
  const [editId, setEditId] = useState(null);
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM);

  const [search, setSearch] = useState("");
  const [leaveFilter, setLeaveFilter] = useState("All");
  const [rosterMonth, setRosterMonth] = useState(new Date().getMonth() + 1);
  const [rosterYear, setRosterYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (text, type = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API);
      setEmployees(res.data);
    } catch {
      notify(
        "Couldn't load employees. Check your connection and refresh.",
        "err",
      );
    }
  };
  const fetchTeams = async () => {
    try {
      setTeams((await axios.get(`${BASE}/teams`)).data);
    } catch {
      notify("Couldn't load teams.", "err");
    }
  };
  const fetchLeaves = async () => {
    try {
      setLeaves((await axios.get(`${BASE}/leaves`)).data);
    } catch {
      notify("Couldn't load leave requests.", "err");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
    fetchLeaves();
  }, []);

  /* ---------- Employees ---------- */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const saveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, form);
        notify("Employee updated");
      } else {
        await axios.post(API, form);
        notify("Employee added");
      }
      setEditId(null);
      setForm(EMPTY_EMP);
      fetchEmployees();
    } catch (error) {
      notify(error.response?.data?.message || "Something went wrong", "err");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      notify("Employee deleted");
      fetchEmployees();
    } catch {
      notify("Couldn't delete employee", "err");
    }
  };

  /* ---------- Teams ---------- */
  const addTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/teams`, teamForm);
      setTeamForm(EMPTY_TEAM);
      fetchTeams();
      notify("Team created");
    } catch (error) {
      notify(error.response?.data?.message || "Couldn't create team", "err");
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      await axios.delete(`${BASE}/teams/${id}`);
      fetchTeams();
      notify("Team deleted");
    } catch {
      notify("Couldn't delete team", "err");
    }
  };

  /* ---------- Leaves ---------- */
  const addLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/leaves`, leaveForm);
      setLeaveForm(EMPTY_LEAVE);
      fetchLeaves();
      notify("Leave request submitted");
    } catch (error) {
      notify(error.response?.data?.message || "Couldn't submit leave", "err");
    }
  };

  const updateLeaveStatus = async (id, status) => {
    try {
      await axios.put(`${BASE}/leaves/${id}`, { status });
      fetchLeaves();
      notify(`Leave ${status.toLowerCase()}`);
    } catch {
      notify("Couldn't update leave status", "err");
    }
  };

  const deleteLeave = async (id) => {
    if (!window.confirm("Delete this leave request?")) return;
    try {
      await axios.delete(`${BASE}/leaves/${id}`);
      fetchLeaves();
      notify("Leave deleted");
    } catch {
      notify("Couldn't delete leave", "err");
    }
  };

  /* ---------- Roster ---------- */
  const generateRoster = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/rosters/generate`, {
        month: Number(rosterMonth),
        year: Number(rosterYear),
      });
      setRoster(res.data.roster);
      notify("Roster generated");
    } catch (error) {
      notify(
        error.response?.data?.message || "Roster generation failed",
        "err",
      );
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(rosterYear, rosterMonth, 0).getDate();

  // employeeId -> { dayNumber: shift }
  const rosterGrid = useMemo(() => {
    const map = {};
    (roster?.assignments || []).forEach((a) => {
      const id = a.employee?._id || a.employee;
      const day = new Date(a.date).getDate();
      (map[id] ||= {})[day] = a.shift;
    });
    return map;
  }, [roster]);

  const shiftNames = useMemo(
    () => [...new Set((roster?.assignments || []).map((a) => a.shift))],
    [roster],
  );
  const shiftClass = (s) => `shift s${shiftNames.indexOf(s) % 5}`;

  /* ---------- Derived ---------- */
  const filteredEmployees = employees.filter((e) =>
    [e.name, e.employeeId, e.email, e.brand, e.process, e.pod]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const shownLeaves = leaves.filter(
    (l) => leaveFilter === "All" || l.status === leaveFilter,
  );

  const Empty = ({ title, hint }) => (
    <div className="empty">
      <strong>{title}</strong>
      <span>{hint}</span>
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">DS</span>
          <div>
            <h1>DataStraw</h1>
            <p>Roster management</p>
          </div>
        </div>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "nav active" : "nav"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "leaves" && pendingLeaves.length > 0 && (
                <span className="count">{pendingLeaves.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {/* ---------- Overview ---------- */}
        {tab === "overview" && (
          <section>
            <div className="page-head">
              <h2>Overview</h2>
              <p>Where your workforce stands today.</p>
            </div>
            <div className="stats">
              <div className="stat">
                <span>Employees</span>
                <b>{employees.length}</b>
              </div>
              <div className="stat">
                <span>Teams</span>
                <b>{teams.length}</b>
              </div>
              <div className="stat warn">
                <span>Leaves awaiting approval</span>
                <b>{pendingLeaves.length}</b>
              </div>
              <div className="stat">
                <span>Roster assignments loaded</span>
                <b>{roster?.assignments?.length || 0}</b>
              </div>
            </div>
            <div className="panel">
              <h3>Pending leave requests</h3>
              {pendingLeaves.length === 0 ? (
                <Empty
                  title="Nothing to approve"
                  hint="New leave requests will show up here."
                />
              ) : (
                pendingLeaves.slice(0, 5).map((l) => (
                  <div className="row" key={l._id}>
                    <div className="avatar">{initials(l.employee?.name)}</div>
                    <div className="grow">
                      <b>{l.employee?.name || "Employee"}</b>
                      <small>
                        {fmt(l.startDate)} – {fmt(l.endDate)}
                      </small>
                    </div>
                    <button
                      className="btn sm ok"
                      onClick={() => updateLeaveStatus(l._id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn sm ghost"
                      onClick={() => updateLeaveStatus(l._id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ---------- Employees ---------- */}
        {tab === "employees" && (
          <section>
            <div className="page-head">
              <h2>Employees</h2>
              <p>{employees.length} people on the roster.</p>
            </div>

            <form onSubmit={saveEmployee} className="panel form-grid">
              <h3 className="span">
                {editId ? "Edit employee" : "Add employee"}
              </h3>
              <label>
                Employee ID
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>
              <label>
                Brand
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Process
                <input
                  name="process"
                  value={form.process}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Pod
                <input name="pod" value={form.pod} onChange={handleChange} />
              </label>
              <div className="actions span">
                <button className="btn" type="submit">
                  {editId ? "Save changes" : "Add employee"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setEditId(null);
                      setForm(EMPTY_EMP);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="panel">
              <div className="toolbar">
                <h3>All employees</h3>
                <input
                  className="search"
                  placeholder="Search by name, ID, brand, pod…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {filteredEmployees.length === 0 ? (
                <Empty
                  title="No employees found"
                  hint="Try a different search or add a new employee above."
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Brand</th>
                        <th>Process</th>
                        <th>Pod</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <div className="person">
                              <div className="avatar">{initials(emp.name)}</div>
                              <div>
                                <b>{emp.name}</b>
                                <small>
                                  {emp.employeeId} · {emp.email}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>{emp.brand}</td>
                          <td>{emp.process}</td>
                          <td>{emp.pod || "—"}</td>
                          <td>
                            <span
                              className={`badge ${(emp.status || "Active").toLowerCase()}`}
                            >
                              {emp.status || "Active"}
                            </span>
                          </td>
                          <td className="right">
                            <button
                              className="btn sm ghost"
                              onClick={() => editEmployee(emp)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn sm danger"
                              onClick={() => deleteEmployee(emp._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ---------- Teams ---------- */}
        {tab === "teams" && (
          <section>
            <div className="page-head">
              <h2>Teams</h2>
              <p>Group people by brand and process.</p>
            </div>
            <form onSubmit={addTeam} className="panel form-grid">
              <h3 className="span">Create team</h3>
              <label>
                Team name
                <input
                  value={teamForm.teamName}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, teamName: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Team leader
                <input
                  value={teamForm.teamLeader}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, teamLeader: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Brand
                <input
                  value={teamForm.brand}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, brand: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Process
                <input
                  value={teamForm.process}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, process: e.target.value })
                  }
                  required
                />
              </label>
              <div className="actions span">
                <button className="btn" type="submit">
                  Create team
                </button>
              </div>
            </form>

            {teams.length === 0 ? (
              <div className="panel">
                <Empty
                  title="No teams yet"
                  hint="Create your first team above."
                />
              </div>
            ) : (
              <div className="cards">
                {teams.map((team) => (
                  <article key={team._id} className="card">
                    <h4>{team.teamName}</h4>
                    <dl>
                      <dt>Leader</dt>
                      <dd>{team.teamLeader}</dd>
                      <dt>Brand</dt>
                      <dd>{team.brand}</dd>
                      <dt>Process</dt>
                      <dd>{team.process}</dd>
                    </dl>
                    <button
                      className="btn sm danger"
                      onClick={() => deleteTeam(team._id)}
                    >
                      Delete team
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------- Leaves ---------- */}
        {tab === "leaves" && (
          <section>
            <div className="page-head">
              <h2>Leaves</h2>
              <p>Request, approve and track time off.</p>
            </div>
            <form onSubmit={addLeave} className="panel form-grid">
              <h3 className="span">Apply for leave</h3>
              <label>
                Employee
                <select
                  value={leaveForm.employee}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, employee: e.target.value })
                  }
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                From
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, startDate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  min={leaveForm.startDate}
                  value={leaveForm.endDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, endDate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Reason
                <input
                  value={leaveForm.reason}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, reason: e.target.value })
                  }
                  required
                />
              </label>
              <div className="actions span">
                <button className="btn" type="submit">
                  Submit request
                </button>
              </div>
            </form>

            <div className="panel">
              <div className="toolbar">
                <h3>Leave requests</h3>
                <div className="chips">
                  {["All", "Pending", "Approved", "Rejected"].map((f) => (
                    <button
                      key={f}
                      className={leaveFilter === f ? "chip on" : "chip"}
                      onClick={() => setLeaveFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {shownLeaves.length === 0 ? (
                <Empty
                  title="No leave requests"
                  hint="Nothing matches this filter."
                />
              ) : (
                shownLeaves.map((l) => (
                  <div className="row" key={l._id}>
                    <div className="avatar">{initials(l.employee?.name)}</div>
                    <div className="grow">
                      <b>{l.employee?.name || "Employee"}</b>
                      <small>
                        {fmt(l.startDate)} – {fmt(l.endDate)} · {l.reason}
                      </small>
                    </div>
                    <span className={`badge ${l.status?.toLowerCase()}`}>
                      {l.status}
                    </span>
                    {l.status === "Pending" && (
                      <>
                        <button
                          className="btn sm ok"
                          onClick={() => updateLeaveStatus(l._id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn sm ghost"
                          onClick={() => updateLeaveStatus(l._id, "Rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="btn sm danger"
                      onClick={() => deleteLeave(l._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ---------- Roster ---------- */}
        {tab === "roster" && (
          <section>
            <div className="page-head">
              <h2>Monthly roster</h2>
              <p>Pick a month and generate shifts for everyone.</p>
            </div>
            <div className="panel toolbar">
              <div className="inline">
                <label>
                  Month
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={rosterMonth}
                    onChange={(e) => setRosterMonth(e.target.value)}
                  />
                </label>
                <label>
                  Year
                  <input
                    type="number"
                    value={rosterYear}
                    onChange={(e) => setRosterYear(e.target.value)}
                  />
                </label>
              </div>
              <button
                className="btn"
                onClick={generateRoster}
                disabled={loading}
              >
                {loading ? "Generating…" : "Generate roster"}
              </button>
            </div>

            <div className="panel">
              {!roster?.assignments?.length ? (
                <Empty
                  title="No roster yet"
                  hint="Choose a month and select Generate roster."
                />
              ) : (
                <>
                  <div className="legend">
                    {shiftNames.map((s) => (
                      <span key={s} className={shiftClass(s)}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="table-wrap">
                    <table className="grid">
                      <thead>
                        <tr>
                          <th className="sticky">Employee</th>
                          {Array.from({ length: daysInMonth }, (_, i) => (
                            <th key={i}>{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(rosterGrid).map((id) => (
                          <tr key={id}>
                            <td className="sticky">
                              <b>
                                {employees.find((e) => e._id === id)?.name ||
                                  "Employee"}
                              </b>
                            </td>
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const s = rosterGrid[id][i + 1];
                              return (
                                <td key={i}>
                                  {s ? (
                                    <span className={shiftClass(s)} title={s}>
                                      {s[0]}
                                    </span>
                                  ) : (
                                    <span className="off">·</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default App;
