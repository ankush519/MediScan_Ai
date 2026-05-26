import io
import os
import tempfile
import base64
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from PIL import Image as PILImage

def generate_pdf_report(
    patient_name: str,
    symptoms: str,
    prediction: str,
    confidence: float,
    risk_level: str,
    recommendations: list,
    original_base64: str,
    heatmap_base64: str,
    created_at: str
) -> bytes:
    """
    Generates a professional medical diagnosis report in PDF format.
    Images are decoded from Base64, processed, and embedded side-by-side.
    """
    # Create an in-memory buffer to write PDF data to
    pdf_buffer = io.BytesIO()
    
    # Page setup
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom Styles for Healthcare Aesthetics
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'), # Slate 900
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'), # Slate 500
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E3A8A'), # Navy Blue
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'), # Slate 700
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    disclaimer_style = ParagraphStyle(
        'DocDisclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#94A3B8'), # Slate 400
        spaceBefore=15
    )

    story = []
    
    # 1. Header (MediScan AI Banner)
    header_data = [
        [
            Paragraph("<b>MEDISCAN AI</b><br/><font color='#64748B' size=8>Advanced Diagnostics Engine</font>", ParagraphStyle('H1', parent=body_style, fontSize=16, leading=18, textColor=colors.HexColor('#1E3A8A'))),
            Paragraph(f"<b>Report ID:</b> {os.urandom(4).hex().upper()}<br/><b>Date:</b> {created_at[:10]} {created_at[11:16]}", ParagraphStyle('HR', parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#E2E8F0')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # 2. Main Title
    story.append(Paragraph("CLINICAL DIAGNOSIS REPORT", title_style))
    story.append(Paragraph("AI-assisted analysis of thoracic chest radiograph (X-ray) scans.", subtitle_style))
    
    # 3. Patient Information Block
    patient_data = [
        [Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient_name, body_style),
         Paragraph("<b>Referring Clinician:</b>", body_style), Paragraph("MediScan System Portal", body_style)],
        [Paragraph("<b>Primary Symptoms:</b>", body_style), Paragraph(symptoms if symptoms else "Not provided", body_style),
         Paragraph("<b>Scan Target:</b>", body_style), Paragraph("Chest Radiograph (PA View)", body_style)]
    ]
    patient_table = Table(patient_data, colWidths=[100, 170, 120, 150])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 15))
    
    # 4. Findings & Risk Analysis
    # Set color based on prediction and risk
    risk_color = '#EF4444' if risk_level == "High" else ('#F59E0B' if risk_level == "Medium" else '#10B981')
    
    findings_data = [
        [
            Paragraph(f"<b>AI Diagnosis:</b> <font color='{risk_color}'>{prediction.upper()}</font>", ParagraphStyle('DiagText', parent=body_style, fontSize=12, leading=14)),
            Paragraph(f"<b>Confidence:</b> {confidence * 100:.1f}%", ParagraphStyle('ConfText', parent=body_style, fontSize=12, leading=14)),
            Paragraph(f"<b>Severity Risk:</b> <font color='{risk_color}'><b>{risk_level.upper()}</b></font>", ParagraphStyle('RiskText', parent=body_style, fontSize=12, leading=14))
        ]
    ]
    findings_table = Table(findings_data, colWidths=[180, 180, 180])
    findings_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor(risk_color)),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFFBEB') if risk_level != 'Low' else colors.HexColor('#F0FDF4')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(findings_table)
    story.append(Spacer(1, 15))
    
    # 5. Visual Scan Comparison Section (Original & Heatmap Overlay)
    # Write base64 to temp files to import into ReportLab
    temp_orig = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    temp_heat = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    
    try:
        # Helper to clean base64 data headers if they exist
        orig_data = original_base64.split(",")[-1]
        heat_data = heatmap_base64.split(",")[-1]
        
        with open(temp_orig.name, "wb") as fh:
            fh.write(base64.b64decode(orig_data))
        with open(temp_heat.name, "wb") as fh:
            fh.write(base64.b64decode(heat_data))
            
        # Verify and resize with PIL to standard dimensions
        with PILImage.open(temp_orig.name) as im:
            im.resize((240, 240)).save(temp_orig.name, "JPEG")
        with PILImage.open(temp_heat.name) as im:
            im.resize((240, 240)).save(temp_heat.name, "JPEG")
            
        # Create ReportLab Image flowables
        img_width = 2.8 * inch # approx 200 pt
        img_height = 2.8 * inch
        
        orig_flowable = Image(temp_orig.name, width=img_width, height=img_height)
        heat_flowable = Image(temp_heat.name, width=img_width, height=img_height)
        
        images_data = [
            [orig_flowable, heat_flowable],
            [Paragraph("<font color='#64748B' size=8>Figure A: Original Chest Radiograph</font>", ParagraphStyle('Cap1', parent=body_style, alignment=1)),
             Paragraph("<font color='#64748B' size=8>Figure B: Explainable AI (Grad-CAM) Heatmap</font>", ParagraphStyle('Cap2', parent=body_style, alignment=1))]
        ]
        
        images_table = Table(images_data, colWidths=[270, 270])
        images_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,0), 4),
            ('TOPPADDING', (0,1), (-1,1), 4),
        ]))
        
        # Keep visual sections together to prevent splitting pages awkwardly
        story.append(KeepTogether([
            Paragraph("IMAGING ANALYSIS", h2_style),
            Paragraph("The Grad-CAM visualization highlight regions (in red/orange) where the convolutional layers identified density deviations, consistent with pulmonary inflammation or alveolar exudate.", body_style),
            Spacer(1, 10),
            images_table
        ]))
        
    except Exception as e:
        print(f"Error drawing images in PDF report: {e}")
        story.append(Paragraph("[Image Render Error: Scans could not be rendered in PDF report]", body_style))
    
    story.append(Spacer(1, 15))
    
    # 6. Recommendations / Clinician Directives
    rec_items = []
    for rec in recommendations:
        rec_items.append(Paragraph(f"&bull; {rec}", bullet_style))
        
    story.append(KeepTogether([
        Paragraph("CLINICAL RECOMMENDATIONS", h2_style),
        *rec_items
    ]))
    
    # 7. Disclaimer Footer
    disclaimer_text = (
        "<b>Disclaimer:</b> This diagnostic summary is generated by the MediScan AI neural network. "
        "Computer-aided detection models are intended as decision support tools and do not substitute for "
        "professional medical diagnosis, physical examinations, or clinical judgment. All outcomes should be "
        "validated by a licensed radiologist or pulmonologist before finalizing treatment plans."
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph(disclaimer_text, disclaimer_style))
    
    # Build Document
    doc.build(story)
    
    # Clean up temp files
    try:
        os.unlink(temp_orig.name)
        os.unlink(temp_heat.name)
    except Exception:
        pass
        
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes
