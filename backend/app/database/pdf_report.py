import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch


def generate_pdf_report(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("TitleCustom", parent=styles["Title"], textColor=colors.HexColor("#19152E"))
    heading_style = ParagraphStyle("HeadingCustom", parent=styles["Heading2"], textColor=colors.HexColor("#6C56E8"), spaceBefore=16, spaceAfter=8)
    normal = styles["Normal"]

    story = []
    story.append(Paragraph("Cognitive Alarm Platform — Habit Report", title_style))
    story.append(Paragraph(f"{data['user_name']} ({data['user_email']})", normal))
    story.append(Paragraph(f"Generated {data['generated_at']}", normal))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Overview", heading_style))
    overview_table = [
        ["Total Alarms", str(data["total_alarms"])],
        ["Total Wake-Up Sessions", str(data["total_sessions"])],
        ["Verified Sessions", str(data["verified_sessions"])],
        ["Current Streak", f"{data['streak']['current_streak']} days"],
        ["Longest Streak", f"{data['streak']['longest_streak']} days"],
    ]
    t = Table(overview_table, colWidths=[2.5 * inch, 2.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F8F6FC")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E9E5F3")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

    story.append(Paragraph("Habit Score Breakdown", heading_style))
    hs = data["habit_scores"]
    habit_table = [
        ["Component", "Score"],
        ["Wake-Up Consistency", f"{hs['wake_consistency_score']}%"],
        ["Challenge Completion", f"{hs['challenge_completion_score']}%"],
        ["Snooze Reduction", f"{hs['snooze_reduction_score']}%"],
        ["Sleep Schedule Adherence", f"{hs['sleep_adherence_score']}%"],
        ["Productivity", f"{hs['productivity_score']}%"],
        ["Total Habit Score", f"{hs['total_score']}/100"],
    ]
    t2 = Table(habit_table, colWidths=[3 * inch, 2 * inch])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6C56E8")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E9E5F3")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(t2)

    story.append(Paragraph("Behavioral Analytics", heading_style))
    story.append(Paragraph(f"Best day: {data['behavior']['best_day']} | Worst day: {data['behavior']['worst_day']}", normal))
    story.append(Paragraph(f"Average response time: {data['behavior']['avg_response_time_minutes']} minutes", normal))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Sleep Pattern", heading_style))
    story.append(Paragraph(data["sleep"]["insight"], normal))

    story.append(Paragraph("Productivity Correlation", heading_style))
    prod = data["productivity"]
    if prod["correlation"] is not None:
        story.append(Paragraph(f"Correlation: {prod['correlation']} ({prod['strength']}) across {prod['days_analyzed']} days", normal))
        story.append(Paragraph(prod["insight"], normal))
    else:
        story.append(Paragraph(prod["insight"], normal))

    story.append(Paragraph("Challenge Type Performance", heading_style))
    perf_rows = [["Type", "Avg Attempts", "Sessions"]]
    for ctype, stats in data["challenge_perf"].items():
        if stats["count"] > 0:
            perf_rows.append([ctype.replace("_", " ").title(), str(stats["avg_attempts"]), str(stats["count"])])
    if len(perf_rows) > 1:
        t3 = Table(perf_rows, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch])
        t3.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F8F6FC")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E9E5F3")),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t3)
    else:
        story.append(Paragraph("No completed challenges yet.", normal))

    doc.build(story)
    buffer.seek(0)
    return buffer