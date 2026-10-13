import {
  MARGIN,
  CONTENT_WIDTH,
  COLORS,
} from "./interface";

export function drawHeader(
  doc: PDFKit.PDFDocument
): void {

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.primary)
    .text(
      "ABC MEDICAL CENTER",
      MARGIN,
      45,
      {
        width: CONTENT_WIDTH,
        align: "center",
      }
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "123 Main Street, Dhaka",
      {
        width: CONTENT_WIDTH,
        align: "center",
      }
    );

  doc.text(
    "Phone: 01243-545464",
    {
      width: CONTENT_WIDTH,
      align: "center",
    }
  );

  doc.moveDown(1);

  // Header divider
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(
      MARGIN + CONTENT_WIDTH,
      doc.y
    )
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .stroke();

  doc.y += 15;
}
