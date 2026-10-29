
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./MonthlyReport.css";

const getTodayMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
};

const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const createEmptyEntry = (date) => ({
    report_date: date,
    work_description: "",
    project_learning: "",
    leave_comp_off: "",
    hours: "0",
});

function MonthlyReport() {
    const navigate = useNavigate();
    const [month, setMonth] = useState(getTodayMonth());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const loadReport = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const response = await api.get("/api/monthly-report", {
                params: { month },
            });

            const savedEntries = response.data.entries || [];
            const tasksByDate = new Map();

            // Group tasks by start_date
            (response.data.tasksByDate || []).forEach((task) => {
                const date = new Date(task.task_date)
                    .toISOString()
                    .slice(0, 10);
                const description = task.task_work_description || "";

                if (!tasksByDate.has(date)) {
                    tasksByDate.set(date, []);
                }

                if (description.trim()) {
                    tasksByDate.get(date).push(description.trim());
                }
            });

            const [year, monthNumber] = month.split("-").map(Number);
            const daysInMonth = new Date(year, monthNumber, 0).getDate();

            const savedByDate = new Map(
                savedEntries.map((entry) => [
                    String(entry.report_date).slice(0, 10),
                    entry,
                ])
            );

            const generatedRows = Array.from(
                { length: daysInMonth },
                (_, index) => {
                    const date = getDateString(
                        new Date(year, monthNumber - 1, index + 1)
                    );

                    const savedEntry = savedByDate.get(date);
                    const taskDescriptions = tasksByDate.get(date) || [];

                    // Check whether this date is Sunday
                    const isSunday =
                        new Date(year, monthNumber - 1, index + 1).getDay() === 0;

                    // Preserve saved text and add tasks that aren't already present
                    const savedDescription =
                        savedEntry?.work_description || "";

                    const combinedDescription = [
                        savedDescription.trim(),
                        ...taskDescriptions,
                    ]
                        .filter(Boolean)
                        .join("\n");

                    return {
                        ...createEmptyEntry(date),
                        ...(savedEntry || {}),

                        report_date: date,

                        work_description: [
                            ...new Set(
                                combinedDescription
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                            ),
                        ].join("\n"),

                        // Automatically select Sunday Holiday on Sundays
                        leave_comp_off: isSunday
                            ? "Sunday Holiday"
                            : (savedEntry?.leave_comp_off || ""),

                        hours: String(savedEntry?.hours ?? 0),
                    };
                }
            );


            setRows(generatedRows);

            console.log("Monthly report tasks:", response.data.tasksByDate);
            console.log("Mapped monthly rows:", generatedRows);
        } catch (err) {
            console.error("Monthly report load error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load monthly report."
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadReport();
    }, [month]);

    const updateRow = (date, field, value) => {
        setRows((previous) =>
            previous.map((row) =>
                row.report_date === date
                    ? { ...row, [field]: value }
                    : row
            )
        );
    };


    const [savingDate, setSavingDate] = useState("");

    const saveRow = async (row) => {
        try {
            setError("");
            setMessage("");
            setSavingDate(row.report_date);

            console.log("Saving monthly report:", row);

            const response = await api.post("/api/monthly-report", {
                report_date: row.report_date,
                work_description: row.work_description,
                project_learning: row.project_learning,
                leave_comp_off: row.leave_comp_off,
                hours: Number(row.hours || 0),
            });

            console.log("Save response:", response.data);
            setMessage(`Entry saved for ${row.report_date}.`);
        } catch (err) {
            console.error(
                "Monthly report save error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                `Failed to save ${row.report_date}.`
            );
        } finally {
            setSavingDate("");
        }
    };

    const downloadExcel = async () => {
        try {
            setError("");
            setMessage("");

            const XLSX = await import("xlsx-js-style");
            const excelRows = [];

            let serialNumber = 1;

            rows.forEach((row) => {
                const [year, monthNumber, dayNumber] =
                    row.report_date.split("-").map(Number);

                const date = new Date(year, monthNumber - 1, dayNumber);

                const dayName = date.toLocaleDateString("en-US", {
                    weekday: "long",
                });

                // Show all tasks as bullet points in one cell
                const tasks = (row.work_description || "")
                    .split(/\r?\n/)
                    .map((task) => task.trim())
                    .filter(Boolean);

                const pointWiseTasks = tasks
                    .map((task) => task.replace(/^[\s•●▪◦\-]+/, "").trim())
                    .filter(Boolean)
                    .map((task) => `• ${task}`)
                    .join("\n");
                // One Excel row per date
                excelRows.push({
                    "Sr.No.": serialNumber++,
                    Date: row.report_date,
                    Day: dayName,
                    "Work Description": pointWiseTasks,
                    "Project / Learning": row.project_learning || "",
                    "Leaves/Comp Off": row.leave_comp_off || "",
                    Hours: Number(row.hours || 0),
                });
            });

            const worksheet = XLSX.utils.json_to_sheet(excelRows, {
                header: [
                    "Sr.No.",
                    "Date",
                    "Day",
                    "Work Description",
                    "Project / Learning",
                    "Leaves/Comp Off",
                    "Hours",
                ],
            });

            // Set column widths
            worksheet["!cols"] = [
                { wch: 9 },
                { wch: 15 },
                { wch: 15 },
                { wch: 55 },
                { wch: 30 },
                { wch: 20 },
                { wch: 10 },
            ];

            // Style every data row
            excelRows.forEach((row, index) => {
                const excelRowIndex = index + 1; // Row 0 is the header
                const isSunday =
                    new Date(`${row.Date}T00:00:00`).getDay() === 0;

                for (let col = 0; col < 7; col++) {
                    const cellAddress = XLSX.utils.encode_cell({
                        r: excelRowIndex,
                        c: col,
                    });

                    if (!worksheet[cellAddress]) continue;

                    worksheet[cellAddress].s = {
                        alignment: {
                            vertical: "top",
                            wrapText: true,
                        },
                        ...(isSunday && {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: "FFFFCCCC" },
                            },
                        }),
                    };
                }
            });

            // Create and download Excel file
            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Monthly Report"
            );

            XLSX.writeFile(
                workbook,
                `Monthly_Report_${month}.xlsx`
            );

            setMessage("Excel file downloaded successfully.");
        } catch (err) {
            console.error("Excel download error:", err);
            setError("Excel download failed. Please try again.");
        }
    };



    return (
        <main className="monthly-report-page">
            <header className="monthly-report-header">
                <div>
                    <h1>Monthly Report</h1>
                    <p>Daily work, project learning, leave and hours</p>
                </div>


                <div className="monthly-report-buttons">
                    <input
                        aria-label="Select report month"
                        type="month"
                        value={month}
                        onChange={(event) => setMonth(event.target.value)}
                    />
                    <button
                        className="back-dashboard-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Back to Dashboard
                    </button>

                    <button onClick={loadReport} disabled={loading}>
                        Refresh
                    </button>

                    <button onClick={downloadExcel}>
                        Download Excel
                    </button>
                </div>
            </header>

            {message && <p className="monthly-success">{message}</p>}
            {error && <p className="monthly-error">{error}</p>}

            {
                loading ? (
                    <p>Loading monthly report...</p>
                ) : (
                    <div className="monthly-table-wrapper">
                        <table className="monthly-report-table">
                            <thead>
                                <tr>
                                    <th>Sr.No.</th>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Work Description</th>
                                    <th>Project / Learning</th>
                                    <th>Leaves/Comp Off</th>
                                    <th>Hours</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((row, index) => {
                                    const [year, monthNumber, dayNumber] =
                                        row.report_date.split("-").map(Number);

                                    const date = new Date(
                                        year,
                                        monthNumber - 1,
                                        dayNumber
                                    );

                                    const dayName = date.toLocaleDateString("en-US", {
                                        weekday: "long",
                                    });

                                    return (
                                        <tr
                                            key={row.report_date}
                                            className={
                                                new Date(
                                                    ...row.report_date.split("-").map(Number).map((v, i) =>
                                                        i === 1 ? v - 1 : v
                                                    )
                                                ).getDay() === 0
                                                    ? "sunday-row"
                                                    : ""
                                            }
                                        >
                                            <td>{index + 1}</td>
                                            <td>{row.report_date}</td>
                                            <td>{dayName}</td>

                                            <td>
                                                <textarea
                                                    value={row.work_description || ""}
                                                    onChange={(event) =>
                                                        updateRow(
                                                            row.report_date,
                                                            "work_description",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Enter work done..."
                                                />
                                            </td>

                                            <td>
                                                <textarea
                                                    value={row.project_learning || ""}
                                                    onChange={(event) =>
                                                        updateRow(
                                                            row.report_date,
                                                            "project_learning",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Project / learning"
                                                />
                                            </td>

                                            <td>
                                                <select
                                                    value={row.leave_comp_off || ""}
                                                    onChange={(event) =>
                                                        updateRow(
                                                            row.report_date,
                                                            "leave_comp_off",
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">—</option>
                                                    <option value="Leave">Leave</option>
                                                    <option value="Comp Off">Comp Off</option>
                                                    <option value="Sunday Holiday">
                                                        Sunday Holiday
                                                    </option>
                                                </select>
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={row.hours ?? 0}
                                                    onChange={(event) =>
                                                        updateRow(
                                                            row.report_date,
                                                            "hours",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    onClick={() => saveRow(row)}
                                                    disabled={savingDate === row.report_date}
                                                >
                                                    {savingDate === row.report_date ? "Saving..." : "Save"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </main >
    );
}

export default MonthlyReport;