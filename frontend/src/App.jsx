import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const BASE = "https://datastaw-roster.onrender.com/api";
const API = `${BASE}/employees`;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SHIFTS = ["Morning", "Evening", "Night"];

const EMPTY_EMP = {
  employeeId: "",
  name: "",
  email: "",
  phone: "",
  brand: "",
  process: "",
  brandsText: "",
  processesText: "",
  pod: "",
  role: "Employee",
  weeklyOffs: ["Sunday"],
  shiftPreferences: [],
};

const EMPTY_LEAVE = {
  employee: "",
  startDate: "",
  endDate: "",
  reason: "",
  leaveType: "Casual",
};

const EMPTY_TEAM = {
  teamName: "",
  teamLeader: "",
  brand: "",
  process: "",
};

const EMPTY_HOLIDAY = {
  name: "",
  date: "",
  brand: "All",
  process: "All",
  appliesTo: "All",
  description: "",
};

const EMPTY_RULE = {
  brand: "",
  process: "",
  operatingDays: [...DAYS],
  minimumStaff: 1,
  shifts: ["Morning", "Evening", "Night"],
  holidayPolicy: "ExcludeSundaysAndHolidays",
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "employees", label: "Employees" },
  { id: "teams", label: "Teams" },
  { id: "leaves", label: "Leaves" },
  { id: "holidays", label: "Holidays" },
  { id: "rules", label: "Roster Rules" },
  { id: "roster", label: "Monthly Roster" },
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

const splitValues = (value) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

function App() {
  const [tab, setTab] = useState("overview");

  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [rules, setRules] = useState([]);
  const [roster, setRoster] = useState(null);

  const [form, setForm] = useState(EMPTY_EMP);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM);
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE);
  const [holidayForm, setHolidayForm] = useState(EMPTY_HOLIDAY);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [leaveFilter, setLeaveFilter] = useState("All");

  const [rosterMonth, setRosterMonth] = useState(new Date().getMonth() + 1);
  const [rosterYear, setRosterYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [editAssignment, setEditAssignment] = useState(null);
  const [editEmployee, setEditEmployee] = useState("");
  const [editShift, setEditShift] = useState("Morning");
  const [editNotes, setEditNotes] = useState("");

  const notify = (message, type = "ok") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const load = async (url, setter, label) => {
    try {
      const response = await axios.get(url);
      setter(response.data);
    } catch {
      notify(`Couldn't load ${label}`, "err");
    }
  };

  const fetchEmployees = () => load(API, setEmployees, "employees");
  const fetchTeams = () => load(`${BASE}/teams`, setTeams, "teams");
  const fetchLeaves = () => load(`${BASE}/leaves`, setLeaves, "leaves");
  const fetchHolidays = () => load(`${BASE}/holidays`, setHolidays, "holidays");
  const fetchRules = () =>
    load(`${BASE}/roster-rules`, setRules, "roster rules");

  const fetchRoster = async () => {
    try {
      const response = await axios.get(`${BASE}/rosters`, {
        params: { month: Number(rosterMonth), year: Number(rosterYear) },
      });
      setRoster(response.data?._id ? response.data : null);
    } catch {
      notify("Couldn't load roster", "err");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
    fetchLeaves();
    fetchHolidays();
    fetchRules();
  }, []);

  // EMPLOYEES

  const handleEmployeeChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleArrayValue = (field, value, setter, current) => {
    setter({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((v) => v !== value)
        : [...current[field], value],
    });
  };

  const saveEmployee = async (e) => {
    e.preventDefault();

    const brands = splitValues(form.brandsText || form.brand);
    const processes = splitValues(form.processesText || form.process);

    const payload = {
      ...form,
      brand: brands[0] || form.brand,
      process: processes[0] || form.process,
      brands,
      processes,
    };

    delete payload.brandsText;
    delete payload.processesText;

    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, payload);
        notify("Employee updated");
      } else {
        await axios.post(API, payload);
        notify("Employee added");
      }

      setForm(EMPTY_EMP);
      setEditId(null);
      fetchEmployees();
    } catch (error) {
      notify(error.response?.data?.message || "Employee save failed", "err");
    }
  };

  const startEditEmployee = (emp) => {
    setEditId(emp._id);
    setForm({
      ...EMPTY_EMP,
      ...emp,
      brandsText: (emp.brands?.length ? emp.brands : [emp.brand]).join(", "),
      processesText: (emp.processes?.length
        ? emp.processes
        : [emp.process]
      ).join(", "),
      weeklyOffs: emp.weeklyOffs?.length ? emp.weeklyOffs : ["Sunday"],
      shiftPreferences: emp.shiftPreferences || [],
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

  // TEAMS

  const addTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/teams`, teamForm);
      setTeamForm(EMPTY_TEAM);
      fetchTeams();
      notify("Team created");
    } catch (error) {
      notify(error.response?.data?.message || "Team creation failed", "err");
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

  // LEAVES

  const addLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/leaves`, leaveForm);
      setLeaveForm(EMPTY_LEAVE);
      fetchLeaves();
      notify("Leave request submitted");
    } catch (error) {
      notify(error.response?.data?.message || "Leave submission failed", "err");
    }
  };

  const updateLeave = async (id, status) => {
    try {
      await axios.put(`${BASE}/leaves/${id}`, { status });
      fetchLeaves();
      notify(`Leave ${status.toLowerCase()}`);
    } catch {
      notify("Couldn't update leave", "err");
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

  // HOLIDAYS

  const addHoliday = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/holidays`, holidayForm);
      setHolidayForm(EMPTY_HOLIDAY);
      fetchHolidays();
      notify("Holiday added");
    } catch (error) {
      notify(error.response?.data?.message || "Holiday save failed", "err");
    }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await axios.delete(`${BASE}/holidays/${id}`);
      fetchHolidays();
      notify("Holiday deleted");
    } catch {
      notify("Couldn't delete holiday", "err");
    }
  };

  // ROSTER RULES

  const saveRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/roster-rules`, {
        ...ruleForm,
        minimumStaff: Number(ruleForm.minimumStaff),
      });
      setRuleForm(EMPTY_RULE);
      fetchRules();
      notify("Roster rule saved");
    } catch (error) {
      notify(error.response?.data?.message || "Rule save failed", "err");
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await axios.delete(`${BASE}/roster-rules/${id}`);
      fetchRules();
      notify("Rule deleted");
    } catch {
      notify("Couldn't delete rule", "err");
    }
  };

  // ROSTER

  const generateRoster = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE}/rosters/generate`, {
        month: Number(rosterMonth),
        year: Number(rosterYear),
      });

      setRoster(response.data.roster);
      notify(
        response.data.summary?.totalConflicts
          ? `Generated with ${response.data.summary.totalConflicts} conflicts`
          : "Roster generated successfully",
        response.data.summary?.totalConflicts ? "err" : "ok",
      );
    } catch (error) {
      notify(
        error.response?.data?.message || "Roster generation failed",
        "err",
      );
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentEditor = (assignment) => {
    setEditAssignment(assignment);
    setEditEmployee(assignment.employee?._id || assignment.employee || "");
    setEditShift(assignment.shift);
    setEditNotes(assignment.notes || "");
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    if (!roster?._id || !editAssignment?._id) return;

    try {
      const response = await axios.put(
        `${BASE}/rosters/${roster._id}/assignments/${editAssignment._id}`,
        {
          employee: editEmployee,
          shift: editShift,
          notes: editNotes,
        },
      );

      setRoster(response.data.roster);
      setEditAssignment(null);
      notify("Roster assignment updated");
    } catch (error) {
      notify(error.response?.data?.message || "Edit failed", "err");
    }
  };

  const revalidateRoster = async () => {
    try {
      const response = await axios.post(`${BASE}/rosters/revalidate`, {
        month: Number(rosterMonth),
        year: Number(rosterYear),
      });

      await fetchRoster();
      notify(
        `Roster checked: ${response.data.conflicts?.length || 0} conflicts`,
        response.data.conflicts?.length ? "err" : "ok",
      );
    } catch (error) {
      notify(error.response?.data?.message || "Revalidation failed", "err");
    }
  };

  // DERIVED DATA

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const shownLeaves = leaves.filter(
    (l) => leaveFilter === "All" || l.status === leaveFilter,
  );

  const filteredEmployees = employees.filter((emp) =>
    [
      emp.name,
      emp.employeeId,
      emp.email,
      emp.brand,
      emp.process,
      emp.pod,
      ...(emp.brands || []),
      ...(emp.processes || []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const daysInMonth = new Date(rosterYear, rosterMonth, 0).getDate();

  const rosterGrid = useMemo(() => {
    const map = {};

    (roster?.assignments || []).forEach((assignment) => {
      const id = assignment.employee?._id || assignment.employee;
      const day = new Date(assignment.date).getUTCDate();

      if (!id) return;

      if (!map[id]) map[id] = {};
      if (!map[id][day]) map[id][day] = [];

      map[id][day].push(assignment);
    });

    return map;
  }, [roster]);

  const Empty = ({ title, hint }) => (
    <div className="empty">
      <strong>{title}</strong>
      <span>{hint}</span>
    </div>
  );

  const shiftClass = (shift) => {
    if (shift === "Morning") return "shift s0";
    if (shift === "Evening") return "shift s1";
    if (shift === "Night") return "shift s2";
    if (shift === "Leave") return "shift s3";
    return "shift s4";
  };

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
          {TABS.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "nav active" : "nav"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.id === "leaves" && pendingLeaves.length > 0 && (
                <span className="count">{pendingLeaves.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <section>
            <div className="page-head">
              <h2>Overview</h2>
              <p>Workforce and roster management dashboard.</p>
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
              <div className="stat">
                <span>Pending leaves</span>
                <b>{pendingLeaves.length}</b>
              </div>
              <div className="stat">
                <span>Holiday calendar</span>
                <b>{holidays.length}</b>
              </div>
              <div className="stat">
                <span>Roster rules</span>
                <b>{rules.length}</b>
              </div>
              <div className="stat">
                <span>Roster assignments</span>
                <b>{roster?.assignments?.length || 0}</b>
              </div>
            </div>

            <div className="panel">
              <h3>Pending leave requests</h3>
              {pendingLeaves.length === 0 ? (
                <Empty
                  title="Nothing to approve"
                  hint="New leave requests will appear here."
                />
              ) : (
                pendingLeaves.slice(0, 5).map((leave) => (
                  <div className="row" key={leave._id}>
                    <div className="avatar">
                      {initials(leave.employee?.name)}
                    </div>
                    <div className="grow">
                      <b>{leave.employee?.name || "Employee"}</b>
                      <small>
                        {fmt(leave.startDate)} – {fmt(leave.endDate)}
                      </small>
                    </div>
                    <button
                      className="btn sm ok"
                      onClick={() => updateLeave(leave._id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn sm ghost"
                      onClick={() => updateLeave(leave._id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="panel">
              <h3>Quick project status</h3>
              <p>
                Manage employee assignments, operating calendars, staffing rules
                and monthly roster conflicts from the navigation.
              </p>
            </div>
          </section>
        )}

        {/* EMPLOYEES */}
        {tab === "employees" && (
          <section>
            <div className="page-head">
              <h2>Employees</h2>
              <p>{employees.length} employees in the system.</p>
            </div>

            <form onSubmit={saveEmployee} className="panel form-grid">
              <h3 className="span">
                {editId ? "Edit employee" : "Add employee"}
              </h3>

              {[
                ["employeeId", "Employee ID"],
                ["name", "Full name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["brandsText", "Brands (comma separated)"],
                ["processesText", "Processes (comma separated)"],
                ["pod", "Pod"],
                ["role", "Role"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    type={name === "email" ? "email" : "text"}
                    value={form[name] || ""}
                    onChange={handleEmployeeChange}
                    required={[
                      "employeeId",
                      "name",
                      "email",
                      "brandsText",
                      "processesText",
                    ].includes(name)}
                    placeholder={
                      name === "brandsText"
                        ? "HDFC ERGO, Care, Birla"
                        : name === "processesText"
                          ? "Telecalling, Document Verification"
                          : ""
                    }
                  />
                </label>
              ))}

              <div className="span">
                <b>Weekly off days</b>
                <div className="chips">
                  {DAYS.map((day) => (
                    <label className="chip" key={day}>
                      <input
                        type="checkbox"
                        checked={form.weeklyOffs.includes(day)}
                        onChange={() =>
                          toggleArrayValue("weeklyOffs", day, setForm, form)
                        }
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="span">
                <b>Preferred shifts</b>
                <div className="chips">
                  {SHIFTS.map((shift) => (
                    <label className="chip" key={shift}>
                      <input
                        type="checkbox"
                        checked={form.shiftPreferences.includes(shift)}
                        onChange={() =>
                          toggleArrayValue(
                            "shiftPreferences",
                            shift,
                            setForm,
                            form,
                          )
                        }
                      />
                      {shift}
                    </label>
                  ))}
                </div>
              </div>

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
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {filteredEmployees.length === 0 ? (
                <Empty title="No employees found" hint="Try another search." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Brands</th>
                        <th>Processes</th>
                        <th>Pod</th>
                        <th>Weekly off</th>
                        <th>Status</th>
                        <th>Actions</th>
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
                          <td>
                            {(emp.brands?.length
                              ? emp.brands
                              : [emp.brand]
                            ).join(", ")}
                          </td>
                          <td>
                            {(emp.processes?.length
                              ? emp.processes
                              : [emp.process]
                            ).join(", ")}
                          </td>
                          <td>{emp.pod || "—"}</td>
                          <td>{(emp.weeklyOffs || ["Sunday"]).join(", ")}</td>
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
                              onClick={() => startEditEmployee(emp)}
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

        {/* TEAMS */}
        {tab === "teams" && (
          <section>
            <div className="page-head">
              <h2>Teams and Pods</h2>
              <p>Organize employees by team, brand and process.</p>
            </div>

            <form onSubmit={addTeam} className="panel form-grid">
              <h3 className="span">Create team</h3>
              {[
                ["teamName", "Team name"],
                ["teamLeader", "Team leader"],
                ["brand", "Brand"],
                ["process", "Process"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    required
                    value={teamForm[name]}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, [name]: e.target.value })
                    }
                  />
                </label>
              ))}
              <div className="actions span">
                <button className="btn">Create team</button>
              </div>
            </form>

            <div className="cards">
              {teams.map((team) => (
                <article className="card" key={team._id}>
                  <h4>{team.teamName}</h4>
                  <dl>
                    <dt>Leader</dt>
                    <dd>{team.teamLeader}</dd>
                    <dt>Brand</dt>
                    <dd>{team.brand}</dd>
                    <dt>Process</dt>
                    <dd>{team.process}</dd>
                    <dt>Members</dt>
                    <dd>{team.employees?.length || 0}</dd>
                  </dl>
                  <button
                    className="btn sm danger"
                    onClick={() => deleteTeam(team._id)}
                  >
                    Delete team
                  </button>
                </article>
              ))}
              {teams.length === 0 && (
                <Empty title="No teams yet" hint="Create your first team." />
              )}
            </div>
          </section>
        )}

        {/* LEAVES */}
        {tab === "leaves" && (
          <section>
            <div className="page-head">
              <h2>Leave Management</h2>
              <p>Apply, approve and track planned leave and comp-off.</p>
            </div>

            <form onSubmit={addLeave} className="panel form-grid">
              <h3 className="span">Apply for leave</h3>
              <label>
                Employee
                <select
                  required
                  value={leaveForm.employee}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, employee: e.target.value })
                  }
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
                Leave type
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, leaveType: e.target.value })
                  }
                >
                  {["Casual", "Sick", "Earned", "Comp-Off", "Other"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                From
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, startDate: e.target.value })
                  }
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  min={leaveForm.startDate}
                  required
                  value={leaveForm.endDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, endDate: e.target.value })
                  }
                />
              </label>
              <label>
                Reason
                <input
                  required
                  value={leaveForm.reason}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, reason: e.target.value })
                  }
                />
              </label>
              <div className="actions span">
                <button className="btn">Submit leave request</button>
              </div>
            </form>

            <div className="panel">
              <div className="toolbar">
                <h3>Leave requests</h3>
                <div className="chips">
                  {["All", "Pending", "Approved", "Rejected"].map((filter) => (
                    <button
                      key={filter}
                      className={leaveFilter === filter ? "chip on" : "chip"}
                      onClick={() => setLeaveFilter(filter)}
                    >
                      {filter}
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
                shownLeaves.map((leave) => (
                  <div className="row" key={leave._id}>
                    <div className="avatar">
                      {initials(leave.employee?.name)}
                    </div>
                    <div className="grow">
                      <b>{leave.employee?.name || "Employee"}</b>
                      <small>
                        {leave.leaveType || "Casual"} · {fmt(leave.startDate)} –{" "}
                        {fmt(leave.endDate)} · {leave.reason}
                      </small>
                    </div>
                    <span className={`badge ${leave.status?.toLowerCase()}`}>
                      {leave.status}
                    </span>
                    {leave.status === "Pending" && (
                      <>
                        <button
                          className="btn sm ok"
                          onClick={() => updateLeave(leave._id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn sm ghost"
                          onClick={() => updateLeave(leave._id, "Rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="btn sm danger"
                      onClick={() => deleteLeave(leave._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* HOLIDAYS */}
        {tab === "holidays" && (
          <section>
            <div className="page-head">
              <h2>Holiday Calendar</h2>
              <p>
                Configure public holidays for all brands or specific operations.
              </p>
            </div>

            <form onSubmit={addHoliday} className="panel form-grid">
              <h3 className="span">Add holiday</h3>
              <label>
                Holiday name
                <input
                  required
                  value={holidayForm.name}
                  onChange={(e) =>
                    setHolidayForm({ ...holidayForm, name: e.target.value })
                  }
                />
              </label>
              <label>
                Date
                <input
                  required
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) =>
                    setHolidayForm({ ...holidayForm, date: e.target.value })
                  }
                />
              </label>
              <label>
                Applies to
                <select
                  value={holidayForm.appliesTo}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      appliesTo: e.target.value,
                    })
                  }
                >
                  <option value="All">All operations</option>
                  <option value="Brand">Brand</option>
                  <option value="Process">Process</option>
                </select>
              </label>
              <label>
                Brand
                <select
                  value={holidayForm.brand}
                  onChange={(e) =>
                    setHolidayForm({ ...holidayForm, brand: e.target.value })
                  }
                >
                  <option value="All">All brands</option>
                  {[
                    ...new Set(
                      employees.flatMap((emp) =>
                        emp.brands?.length ? emp.brands : [emp.brand],
                      ),
                    ),
                  ].map((brand) => (
                    <option key={brand}>{brand}</option>
                  ))}
                </select>
              </label>
              <label>
                Process
                <select
                  value={holidayForm.process}
                  onChange={(e) =>
                    setHolidayForm({ ...holidayForm, process: e.target.value })
                  }
                >
                  <option value="All">All processes</option>
                  {[
                    ...new Set(
                      employees.flatMap((emp) =>
                        emp.processes?.length ? emp.processes : [emp.process],
                      ),
                    ),
                  ].map((process) => (
                    <option key={process}>{process}</option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <input
                  value={holidayForm.description}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      description: e.target.value,
                    })
                  }
                />
              </label>
              <div className="actions span">
                <button className="btn">Add holiday</button>
              </div>
            </form>

            <div className="panel">
              <h3>Configured holidays ({holidays.length})</h3>
              {holidays.length === 0 ? (
                <Empty
                  title="No holidays configured"
                  hint="Add public holidays above."
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Holiday</th>
                        <th>Date</th>
                        <th>Scope</th>
                        <th>Brand</th>
                        <th>Process</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((holiday) => (
                        <tr key={holiday._id}>
                          <td>{holiday.name}</td>
                          <td>{fmt(holiday.date)}</td>
                          <td>{holiday.appliesTo}</td>
                          <td>{holiday.brand}</td>
                          <td>{holiday.process}</td>
                          <td>
                            <button
                              className="btn sm danger"
                              onClick={() => deleteHoliday(holiday._id)}
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

        {/* ROSTER RULES */}
        {tab === "rules" && (
          <section>
            <div className="page-head">
              <h2>Roster Rules</h2>
              <p>
                Set operating days, minimum staffing and holiday policy for each
                brand/process.
              </p>
            </div>

            <form onSubmit={saveRule} className="panel form-grid">
              <h3 className="span">Configure operating rule</h3>
              <label>
                Brand
                <input
                  required
                  value={ruleForm.brand}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, brand: e.target.value })
                  }
                  placeholder="HDFC ERGO"
                />
              </label>
              <label>
                Process
                <input
                  required
                  value={ruleForm.process}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, process: e.target.value })
                  }
                  placeholder="Telecalling"
                />
              </label>
              <label>
                Minimum staff per day
                <input
                  required
                  type="number"
                  min="0"
                  value={ruleForm.minimumStaff}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, minimumStaff: e.target.value })
                  }
                />
              </label>
              <label>
                Holiday policy
                <select
                  value={ruleForm.holidayPolicy}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, holidayPolicy: e.target.value })
                  }
                >
                  <option value="WorkAllDays">Work all days</option>
                  <option value="ExcludePublicHolidays">
                    Exclude public holidays
                  </option>
                  <option value="ExcludeSundaysAndHolidays">
                    Exclude Sundays and public holidays
                  </option>
                </select>
              </label>

              <div className="span">
                <b>Operating days</b>
                <div className="chips">
                  {DAYS.map((day) => (
                    <label className="chip" key={day}>
                      <input
                        type="checkbox"
                        checked={ruleForm.operatingDays.includes(day)}
                        onChange={() =>
                          toggleArrayValue(
                            "operatingDays",
                            day,
                            setRuleForm,
                            ruleForm,
                          )
                        }
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="span">
                <b>Allowed shifts</b>
                <div className="chips">
                  {SHIFTS.map((shift) => (
                    <label className="chip" key={shift}>
                      <input
                        type="checkbox"
                        checked={ruleForm.shifts.includes(shift)}
                        onChange={() =>
                          toggleArrayValue(
                            "shifts",
                            shift,
                            setRuleForm,
                            ruleForm,
                          )
                        }
                      />
                      {shift}
                    </label>
                  ))}
                </div>
              </div>

              <div className="actions span">
                <button className="btn">Save roster rule</button>
              </div>
            </form>

            <div className="panel">
              <h3>Active rules ({rules.length})</h3>
              {rules.length === 0 ? (
                <Empty
                  title="No rules configured"
                  hint="Create at least one brand/process rule to enable minimum staffing checks."
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Brand</th>
                        <th>Process</th>
                        <th>Minimum staff</th>
                        <th>Operating days</th>
                        <th>Holiday policy</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule._id}>
                          <td>{rule.brand}</td>
                          <td>{rule.process}</td>
                          <td>{rule.minimumStaff}</td>
                          <td>{rule.operatingDays.join(", ")}</td>
                          <td>{rule.holidayPolicy}</td>
                          <td>
                            <button
                              className="btn sm danger"
                              onClick={() => deleteRule(rule._id)}
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

        {/* MONTHLY ROSTER */}
        {tab === "roster" && (
          <section>
            <div className="page-head">
              <h2>Monthly Roster</h2>
              <p>
                Generate shifts, inspect coverage conflicts and edit
                assignments.
              </p>
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
                    min="2020"
                    max="2100"
                    value={rosterYear}
                    onChange={(e) => setRosterYear(e.target.value)}
                  />
                </label>
              </div>
              <div className="actions">
                <button className="btn ghost" onClick={fetchRoster}>
                  Load roster
                </button>
                <button
                  className="btn"
                  onClick={generateRoster}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate roster"}
                </button>
              </div>
            </div>

            {roster && (
              <>
                <div className="stats">
                  <div className="stat">
                    <span>Assignments</span>
                    <b>{roster.assignments?.length || 0}</b>
                  </div>
                  <div className="stat warn">
                    <span>Conflicts</span>
                    <b>{roster.conflicts?.length || 0}</b>
                  </div>
                  <div className="stat">
                    <span>Status</span>
                    <b>{roster.status || "Generated"}</b>
                  </div>
                </div>

                <div className="panel">
                  <div className="toolbar">
                    <h3>Conflict report</h3>
                    <button className="btn sm ghost" onClick={revalidateRoster}>
                      Revalidate roster
                    </button>
                  </div>
                  {!roster.conflicts?.length ? (
                    <Empty
                      title="No recorded conflicts"
                      hint="No staffing gaps were recorded during the last generation or revalidation."
                    />
                  ) : (
                    roster.conflicts.map((conflict) => (
                      <div className="row" key={conflict._id}>
                        <span
                          className={`badge ${conflict.severity === "Critical" ? "rejected" : "pending"}`}
                        >
                          {conflict.severity}
                        </span>
                        <div className="grow">
                          <b>
                            {conflict.brand} / {conflict.process}
                          </b>
                          <small>
                            {conflict.date ? fmt(conflict.date) : ""} ·{" "}
                            {conflict.message}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="panel">
                  <div className="toolbar">
                    <div>
                      <h3>Monthly Employee Roster</h3>
                      <p>
                        {employees.length} employees · {daysInMonth} days
                      </p>
                    </div>
                    <span className="badge active">Grid View</span>
                  </div>

                  <div className="chips roster-legend">
                    <span className="shift s0">Morning</span>
                    <span className="shift s1">Evening</span>
                    <span className="shift s2">Night</span>
                    <span className="shift s4">Weekly Off</span>
                    <span className="shift s3">Leave</span>
                  </div>

                  <div className="table-wrap roster-wrap">
                    <table className="roster-grid">
                      <thead>
                        <tr>
                          <th className="roster-sticky">Employee</th>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const date = new Date(
                              rosterYear,
                              rosterMonth - 1,
                              i + 1,
                            );
                            return (
                              <th
                                key={i}
                                className={
                                  date.getDay() === 0 ? "roster-sunday" : ""
                                }
                              >
                                {i + 1}
                                <small>
                                  {date.toLocaleDateString("en-IN", {
                                    weekday: "short",
                                  })}
                                </small>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {employees.map((emp) => (
                          <tr key={emp._id}>
                            <td className="roster-sticky">
                              <div className="roster-person">
                                <b>{emp.name}</b>
                                <small>{emp.employeeId}</small>
                              </div>
                            </td>

                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const day = i + 1;
                              const assignments =
                                rosterGrid[emp._id]?.[day] || [];

                              return (
                                <td key={day}>
                                  <div className="roster-cell">
                                    {assignments.length > 0 ? (
                                      assignments.map((assignment) => (
                                        <button
                                          key={assignment._id}
                                          type="button"
                                          className={shiftClass(
                                            assignment.shift,
                                          )}
                                          title={`${assignment.brand || ""} ${assignment.process || ""} - ${assignment.shift}`}
                                          onClick={() =>
                                            openAssignmentEditor(assignment)
                                          }
                                        >
                                          {assignment.shift === "Morning"
                                            ? "M"
                                            : assignment.shift === "Evening"
                                              ? "E"
                                              : assignment.shift === "Night"
                                                ? "N"
                                                : assignment.shift ===
                                                    "Weekly Off"
                                                  ? "OFF"
                                                  : assignment.shift ===
                                                      "Public Holiday"
                                                    ? "HOL"
                                                    : assignment.shift ===
                                                        "Leave"
                                                      ? "LEAVE"
                                                      : assignment.shift}
                                        </button>
                                      ))
                                    ) : (
                                      <span className="roster-empty">—</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="hint">
                    Click any shift box to edit the employee assignment.
                  </p>
                </div>

                {editAssignment && (
                  <form className="panel form-grid" onSubmit={saveAssignment}>
                    <h3 className="span">Edit roster assignment</h3>
                    <label>
                      Employee
                      <select
                        value={editEmployee}
                        onChange={(e) => setEditEmployee(e.target.value)}
                        required
                      >
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.employeeId})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Shift
                      <select
                        value={editShift}
                        onChange={(e) => setEditShift(e.target.value)}
                      >
                        {[
                          "Morning",
                          "Evening",
                          "Night",
                          "Weekly Off",
                          "Public Holiday",
                          "Leave",
                        ].map((shift) => (
                          <option key={shift}>{shift}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Notes
                      <input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                    </label>
                    <div className="actions span">
                      <button className="btn">Save assignment</button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setEditAssignment(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {!roster && (
              <div className="panel">
                <Empty
                  title="No roster loaded"
                  hint="Select a month and year, then load an existing roster or generate a new one."
                />
              </div>
            )}
          </section>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
