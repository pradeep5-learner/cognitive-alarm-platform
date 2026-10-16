import { useState } from "react";
import { toast } from "react-toastify";
import { FileText, FileSpreadsheet, Download, Check } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  downloadPdfReport, downloadExcelReport, downloadSystemPdfReport, downloadSystemExcelReport,
} from "../services/reportService";
import { triggerDownload } from "../utils/downloadFile";

const MY_REPORTS = [
  { key: "pdf", title: "PDF report", icon: FileText, tint: "#6C56E8", file: "habit_report.pdf", fetcher: downloadPdfReport,
    desc: "A clean, formatted summary of your habits that is easy to read, print or share with a coach." },
  { key: "excel", title: "Excel workbook", icon: FileSpreadsheet, tint: "#2F9E8F", file: "habit_report.xlsx", fetcher: downloadExcelReport,
    desc: "Five sheets of raw numbers so you can filter, chart and analyze your data yourself." },
];

const SYSTEM_REPORTS = [
  { key: "sys-pdf", title: "System report (PDF)", icon: FileText, tint: "#FF6F5E", file: "system_report.pdf", fetcher: downloadSystemPdfReport,
    desc: "Platform overview, activity, challenge usage, recommendation monitoring and every account." },
  { key: "sys-excel", title: "System report (Excel)", icon: FileSpreadsheet, tint: "#FFB648", file: "system_report.xlsx", fetcher: downloadSystemExcelReport,
    desc: "The same platform data as workbook sheets: users, activity, challenges and recommendations." },
];

const INCLUDES = [
  "Overview, alarms and streaks",
  "Habit score breakdown",
  "Behavioral analytics by day",
  "Sleep pattern insight",
  "Productivity correlation",
  "Challenge type performance",
];

function Reports() {
  const { user } = useAuth();
  const [busyKey, setBusyKey] = useState("");
  const [lastMap, setLastMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("report_last") || "{}");
    } catch (err) {
      return {};
    }
  });

  const handleDownload = async (report) => {
    setBusyKey(report.key);
    try {
      const res = await report.fetcher();
      triggerDownload(res.data, report.file);
      const stamp = new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      const next = { ...lastMap, [report.key]: stamp };
      setLastMap(next);
      localStorage.setItem("report_last", JSON.stringify(next));
      toast.success(`${report.title} downloaded`);
    } catch (err) {
      toast.error("Could not download report");
    } finally {
      setBusyKey("");
    }
  };

  const renderCards = (reports) => (
    <div className="report-grid">
      {reports.map((r) => {
        const Icon = r.icon;
        return (
          <div className="report-card" key={r.key} style={{ "--rc": r.tint }}>
            <div className="report-icon"><Icon size={26} /></div>
            <h3 className="report-title">{r.title}</h3>
            <p className="report-desc">{r.desc}</p>
            <button className="report-btn" onClick={() => handleDownload(r)} disabled={busyKey === r.key}>
              <Download size={16} /> {busyKey === r.key ? "Preparing..." : "Download"}
            </button>
            {lastMap[r.key] && <div className="report-last">Last downloaded {lastMap[r.key]}</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Reports</h1>
          <p className="dashboard-subtitle">Download your wake-up data as a PDF or an Excel workbook</p>
        </div>

        {renderCards(MY_REPORTS)}

        <div className="report-includes">
          <h3 className="chart-title" style={{ margin: 0 }}>What's inside your report</h3>
          <ul>
            {INCLUDES.map((item) => (
              <li key={item}><Check size={16} color="#2F9E8F" strokeWidth={3} /> {item}</li>
            ))}
          </ul>
        </div>

        {user?.role === "admin" && (
          <>
            <h2 className="section-heading">Platform reports</h2>
            {renderCards(SYSTEM_REPORTS)}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Reports;