import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Employee from "./models/Employee.js";
import Team from "./models/Team.js";
import Leave from "./models/Leave.js";
import Roster from "./models/Roster.js";
import Holiday from "./models/Holiday.js";
import RosterRule from "./models/RosterRule.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// -------------------- HELPERS --------------------

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHIFTS = ["Morning", "Evening", "Night"];

const dateKey = (value) => {
  const date = new Date(value);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const makeDate = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day));

const employeeBrands = (emp) =>
  emp.brands?.length ? emp.brands : [emp.brand];

const employeeProcesses = (emp) =>
  emp.processes?.length ? emp.processes : [emp.process];

const employeeWeeklyOffs = (emp) =>
  emp.weeklyOffs?.length ? emp.weeklyOffs : ["Sunday"];

const isEligible = (emp, rule) =>
  employeeBrands(emp).includes(rule.brand) &&
  employeeProcesses(emp).includes(rule.process);

const isOnLeave = (emp, date, leaves) => {
  const key = dateKey(date);

  return leaves.some(
    (leave) =>
      leave.employee.toString() === emp._id.toString() &&
      key >= dateKey(leave.startDate) &&
      key <= dateKey(leave.endDate)
  );
};

const isHolidayFor = (holiday, brand, process) => {
  if (holiday.appliesTo === "All") return true;

  if (holiday.appliesTo === "Brand") {
    return holiday.brand === "All" || holiday.brand === brand;
  }

  if (holiday.appliesTo === "Process") {
    return (
      (holiday.brand === "All" || holiday.brand === brand) &&
      (holiday.process === "All" || holiday.process === process)
    );
  }

  return false;
};

const sendError = (res, error, status = 400) =>
  res.status(status).json({ message: error.message });

// -------------------- HOME --------------------

app.get("/", (req, res) => {
  res.send("DataStraw Smart Roster API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// -------------------- EMPLOYEES --------------------

app.post("/api/employees", async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.brands?.length && data.brand) {
      data.brands = [data.brand];
    }

    if (!data.processes?.length && data.process) {
      data.processes = [data.process];
    }

    const employee = await Employee.create(data);

    res.status(201).json({
      message: "Employee added successfully",
      employee,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.brands?.length) data.brand = data.brands[0];
    if (data.processes?.length) data.process = data.processes[0];

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
});



app.post("/api/teams", async (req, res) => {
  try {
    const team = await Team.create(req.body);

    res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/teams", async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("employees")
      .sort({ teamName: 1 });

    res.json(teams);
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.put("/api/teams/:id", async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({ message: "Team updated successfully", team });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete("/api/teams/:id", async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
});

// -------------------- LEAVES --------------------

app.post("/api/leaves", async (req, res) => {
  try {
    if (new Date(req.body.endDate) < new Date(req.body.startDate)) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    const leave = await Leave.create(req.body);

    res.status(201).json({
      message: "Leave request created successfully",
      leave,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/leaves", async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.put("/api/leaves/:id", async (req, res) => {
  try {
    const allowed = ["Pending", "Approved", "Rejected"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid leave status" });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json({
      message: "Leave status updated successfully. Regenerate or revalidate the roster.",
      leave,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete("/api/leaves/:id", async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json({ message: "Leave deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
});



app.post("/api/holidays", async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);

    res.status(201).json({
      message: "Holiday added successfully",
      holiday,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/holidays", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.delete("/api/holidays/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
});



app.post("/api/roster-rules", async (req, res) => {
  try {
    const rule = await RosterRule.findOneAndUpdate(
      {
        brand: req.body.brand,
        process: req.body.process,
      },
      req.body,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      message: "Roster rule saved successfully",
      rule,
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/roster-rules", async (req, res) => {
  try {
    const rules = await RosterRule.find().sort({
      brand: 1,
      process: 1,
    });

    res.json(rules);
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.delete("/api/roster-rules/:id", async (req, res) => {
  try {
    const rule = await RosterRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({ message: "Roster rule not found" });
    }

    res.json({ message: "Roster rule deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
});


async function buildRoster(month, year) {
  const employees = await Employee.find({ status: "Active" });
  const leaves = await Leave.find({ status: "Approved" });
  const holidays = await Holiday.find();
  const rules = await RosterRule.find({ status: "Active" });

  if (!employees.length) {
    throw new Error("Please add active employees first");
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const assignments = [];
  const conflicts = [];

  const assignedByDate = new Map();
  const usageCount = new Map();

  const addAssignment = (emp, date, shift, brand = "", process = "", notes = "") => {
    const key = `${dateKey(date)}_${emp._id}`;

    if (assignedByDate.has(key)) return false;

    assignments.push({
      employee: emp._id,
      date,
      shift,
      brand,
      process,
      pod: emp.pod || "",
      notes,
    });

    assignedByDate.set(key, true);

    usageCount.set(
      emp._id.toString(),
      (usageCount.get(emp._id.toString()) || 0) + 1
    );

    return true;
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const date = makeDate(year, month, day);
    const dayName = DAYS[date.getUTCDay()];
    const key = dateKey(date);

    const dayHolidays = holidays.filter(
      (holiday) => dateKey(holiday.date) === key
    );

    const unavailable = new Set();

    for (const emp of employees) {
      if (isOnLeave(emp, date, leaves)) {
        unavailable.add(emp._id.toString());

        addAssignment(
          emp,
          date,
          "Leave",
          emp.brand,
          emp.process,
          "Approved leave"
        );
      } else if (employeeWeeklyOffs(emp).includes(dayName)) {
        unavailable.add(emp._id.toString());

        addAssignment(
          emp,
          date,
          "Weekly Off",
          emp.brand,
          emp.process,
          "Configured weekly off"
        );
      }
    }

    for (const rule of rules) {
      const holidayApplies = dayHolidays.some((holiday) =>
        isHolidayFor(holiday, rule.brand, rule.process)
      );

      const isSunday = dayName === "Sunday";

      const shouldClose =
        (rule.holidayPolicy === "ExcludePublicHolidays" && holidayApplies) ||
        (rule.holidayPolicy === "ExcludeSundaysAndHolidays" &&
          (isSunday || holidayApplies)) ||
        !rule.operatingDays.includes(dayName);

      if (shouldClose) continue;

      const eligible = employees
        .filter((emp) => isEligible(emp, rule))
        .filter((emp) => !unavailable.has(emp._id.toString()))
        .filter((emp) => !assignedByDate.has(`${key}_${emp._id}`))
        .sort(
          (a, b) =>
            (usageCount.get(a._id.toString()) || 0) -
            (usageCount.get(b._id.toString()) || 0)
        );

      let allocated = 0;

      for (let i = 0; i < eligible.length && allocated < rule.minimumStaff; i++) {
        const emp = eligible[i];
        const allowedShifts = rule.shifts?.length ? rule.shifts : SHIFTS;
        const shift = allowedShifts[day % allowedShifts.length];

        if (addAssignment(emp, date, shift, rule.brand, rule.process)) {
          allocated++;
        }
      }

      if (allocated < rule.minimumStaff) {
        conflicts.push({
          type: "Coverage Gap",
          date,
          brand: rule.brand,
          process: rule.process,
          severity: "Critical",
          message:
            `Required ${rule.minimumStaff} staff for ${rule.brand} / ${rule.process}, but only ${allocated} could be allocated.`,
        });
      }
    }

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const empId = emp._id.toString();

      if (unavailable.has(empId)) continue;
      if (assignedByDate.has(`${key}_${emp._id}`)) continue;

      const preferences = emp.shiftPreferences?.length
        ? emp.shiftPreferences
        : SHIFTS;

      const shift = preferences[day % preferences.length];

      addAssignment(
        emp,
        date,
        shift,
        emp.brand,
        emp.process,
        "General allocation"
      );
    }
  }

  return {
    assignments,
    conflicts,
    status: conflicts.some((c) => c.severity === "Critical")
      ? "Needs Review"
      : "Generated",
  };
}

app.post("/api/rosters/generate", async (req, res) => {
  try {
    const month = Number(req.body.month);
    const year = Number(req.body.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2020 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Please provide a valid month and year",
      });
    }

    const result = await buildRoster(month, year);

    const roster = await Roster.findOneAndUpdate(
      { month, year },
      {
        month,
        year,
        assignments: result.assignments,
        conflicts: result.conflicts,
        status: result.status,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      message: "Monthly roster generated successfully",
      roster,
      summary: {
        totalAssignments: result.assignments.length,
        totalConflicts: result.conflicts.length,
        status: result.status,
      },
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});



app.get("/api/rosters", async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required",
      });
    }

    const roster = await Roster.findOne({ month, year })
      .populate("assignments.employee");

    res.json(roster || {});
  } catch (error) {
    sendError(res, error, 500);
  }
});



app.put("/api/rosters/:rosterId/assignments/:assignmentId", async (req, res) => {
  try {
    const { employee, shift, brand, process, notes } = req.body;

    const roster = await Roster.findById(req.params.rosterId);

    if (!roster) {
      return res.status(404).json({ message: "Roster not found" });
    }

    const assignment = roster.assignments.id(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (employee) {
      const selectedEmployee = await Employee.findOne({
        _id: employee,
        status: "Active",
      });

      if (!selectedEmployee) {
        return res.status(400).json({
          message: "Selected employee is not active or does not exist",
        });
      }

      assignment.employee = selectedEmployee._id;
    }

    const allowedShifts = [
      "Morning",
      "Evening",
      "Night",
      "Weekly Off",
      "Public Holiday",
      "Leave",
    ];

    if (shift && !allowedShifts.includes(shift)) {
      return res.status(400).json({ message: "Invalid shift" });
    }

    if (shift) assignment.shift = shift;
    if (brand !== undefined) assignment.brand = brand;
    if (process !== undefined) assignment.process = process;
    if (notes !== undefined) assignment.notes = notes;

    assignment.manuallyEdited = true;

    await roster.save();

    const updated = await Roster.findById(roster._id)
      .populate("assignments.employee");

    res.json({
      message: "Roster assignment updated",
      roster: updated,
    });
  } catch (error) {
    sendError(res, error);
  }
});


app.get("/api/rosters/backup-suggestions", async (req, res) => {
  try {
    const { brand, process, date } = req.query;

    if (!brand || !process || !date) {
      return res.status(400).json({
        message: "Brand, process and date are required",
      });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);
    const dayName = DAYS[targetDate.getUTCDay()];

    const employees = await Employee.find({
      status: "Active",
      availability: "Available",
    });

    const leaves = await Leave.find({
      status: "Approved",
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    });

    const suggestions = employees.filter((emp) => {
      const eligible = isEligible(emp, { brand, process });
      const weeklyOff = employeeWeeklyOffs(emp).includes(dayName);
      const onLeave = isOnLeave(emp, targetDate, leaves);

      return eligible && !weeklyOff && !onLeave;
    });

    res.json({
      date,
      brand,
      process,
      suggestions,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});



app.post("/api/rosters/revalidate", async (req, res) => {
  try {
    const month = Number(req.body.month);
    const year = Number(req.body.year);

    const roster = await Roster.findOne({ month, year });

    if (!roster) {
      return res.status(404).json({ message: "Roster not found" });
    }

    const result = await buildRoster(month, year);

    roster.conflicts = result.conflicts;
    roster.status = result.status;

    await roster.save();

    res.json({
      message: "Roster revalidated. Existing assignments were preserved.",
      status: roster.status,
      conflicts: roster.conflicts,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});



const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  });