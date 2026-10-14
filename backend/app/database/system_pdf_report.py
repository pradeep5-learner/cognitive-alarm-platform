import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

VIOLET = colors.HexColor("#6C56E8")
LINE = colors.HexColor("#E9E5F3")


def _table(rows, widths, font=9):
    t = Table(rows, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), VIOLET),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("FONTSIZE", (0, 0), (-1, -1), font),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def _pct(v):
    return "-" if v is None else f"{v}%"


def generate_system_pdf(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.6 * inch, bottomMargin=0.6 * inch,
                            leftMargin=0.6 * inch, rightMargin=0.6 * inch)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("T", parent=styles["Title"], textColor=colors.HexColor("#19152E"))
    h2 = ParagraphStyle("H", parent=styles["Heading2"], textColor=VIOLET, spaceBefore=14, spaceAfter=6)
    cell = ParagraphStyle("C", parent=styles["Normal"], fontSize=8, leading=10)
    normal = styles["Normal"]

    stats = data["stats"]
    rec = data["recommendations"]
    story = [
        Paragraph("Cognitive Alarm Platform — System Report", title),
        Paragraph(f"Generated {data['generated_at']}", normal),
        Spacer(1, 10),
    ]

    story.append(Paragraph("Platform overview", h2))
    story.append(_table([
        ["Metric", "Value"],
        ["Total accounts", stats["total_users"]],
        ["Total alarms", stats["total_alarms"]],
        ["Active alarms", stats["active_alarms"]],
        ["Wake-up sessions", stats["total_wakeup_sessions"]],
        ["Platform completion rate", _pct(stats["platform_completion_rate"])],
        ["Average habit score", stats["avg_habit_score"]],
        ["Notifications sent", data["system"]["notifications"]],
        ["Habit score snapshots", data["system"]["habit_score_snapshots"]],
        ["Productivity ratings logged", data["system"]["productivity_ratings"]],
    ], [3.2 * inch, 2.0 * inch]))

    story.append(Paragraph("Accounts by role", h2))
    story.append(_table([["Role", "Accounts"]] + [[r["role"], r["count"]] for r in data["roles"]], [3.2 * inch, 2.0 * inch]))

    story.append(Paragraph("Difficulty preference distribution", h2))
    story.append(_table([["Level", "Users"]] + [[k.title(), v] for k, v in stats["difficulty_distribution"].items()], [3.2 * inch, 2.0 * inch]))

    story.append(Paragraph("Platform activity, last 14 days", h2))
    story.append(_table(
        [["Date", "Sessions", "Completed", "Active users"]] + [[a["date"], a["sessions"], a["completed"], a["active_users"]] for a in data["activity"]],
        [1.8 * inch, 1.3 * inch, 1.3 * inch, 1.5 * inch]))

    story.append(Paragraph("Challenge type usage", h2))
    if data["challenge_usage"]:
        story.append(_table(
            [["Type", "Sessions", "Completed", "Avg attempts"]] + [
                [c["challenge_type"].replace("_", " ").title(), c["sessions"], c["completed"], c["avg_attempts"]] for c in data["challenge_usage"]],
            [1.8 * inch, 1.3 * inch, 1.3 * inch, 1.5 * inch]))
    else:
        story.append(Paragraph("No challenges recorded yet.", normal))

    story.append(Paragraph("Recommendation monitoring", h2))
    story.append(Paragraph(
        f"{rec['total_recommendations']} recommendations generated across {rec['users_analyzed']} users "
        f"({rec['by_priority']['high']} high, {rec['by_priority']['medium']} medium, {rec['by_priority']['low']} low priority).", normal))
    story.append(Spacer(1, 6))
    if rec["top_recommendations"]:
        story.append(_table([["Most common recommendation", "Users"]] + [[Paragraph(r["title"], cell), r["count"]] for r in rec["top_recommendations"]],
                            [5.0 * inch, 1.0 * inch]))
    story.append(Spacer(1, 6))
    if rec["by_category"]:
        story.append(_table([["Category", "Count"]] + [[c["category"].replace("_", " ").title(), c["count"]] for c in rec["by_category"]],
                            [3.2 * inch, 2.0 * inch]))

    story.append(Paragraph("User directory", h2))
    rows = [["ID", "Name", "Email", "Role", "Coach", "Sessions", "Done", "Habit"]]
    for u in data["users"]:
        rows.append([
            u["id"], Paragraph(u["name"], cell), Paragraph(u["email"], cell), u["role"],
            Paragraph(u["coach"], cell), u["sessions"], _pct(u["completion_rate"]),
            "-" if u["habit_score"] is None else u["habit_score"],
        ])
    story.append(_table(rows, [0.4 * inch, 1.2 * inch, 2.0 * inch, 0.95 * inch, 1.0 * inch, 0.6 * inch, 0.6 * inch, 0.5 * inch], font=8))

    doc.build(story)
    buffer.seek(0)
    return buffer