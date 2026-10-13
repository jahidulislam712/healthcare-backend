import {
  MARGIN,
  CONTENT_WIDTH,
  PAGE_HEIGHT,
  COLORS,
} from "./interface";

export function drawFooter(
  doc: PDFKit.PDFDocument
): void {

  const footerY = PAGE_HEIGHT - 65;

  // Divider
  doc
    .moveTo(MARGIN, footerY)
    .lineTo(
      MARGIN + CONTENT_WIDTH,
      footerY
    )
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .stroke();

  // Footer text
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "This is an electronically generated prescription.",
      MARGIN,
      footerY + 12,
      {
        width: CONTENT_WIDTH,
        align: "center",
      }
    );

  doc.text(
    "Please follow all instructions provided by your doctor.",
    {
      width: CONTENT_WIDTH,
      align: "center",
    }
  );

  doc.text(
    "ABC Medical Center",
    {
      width: CONTENT_WIDTH,
      align: "center",
    }
  );
}
