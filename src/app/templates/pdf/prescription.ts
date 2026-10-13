import PDFDocument from "pdfkit";

import {
  COLORS,
  CONTENT_WIDTH,
  MARGIN,
  PAGE_WIDTH,
  PrescriptionPDFData,
} from "./interface";

import { drawHeader } from "./header";
import { drawFooter } from "./footer";


// ============================================================
// HELPERS
// ============================================================

function drawCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  doc
    .roundedRect(
      x,
      y,
      width,
      height,
      5
    )
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .stroke();
}


function drawLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | number | undefined,
  x: number,
  y: number,
  labelWidth = 70
): void {

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      label,
      x,
      y,
      {
        width: labelWidth,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      String(value ?? "-"),
      x + labelWidth,
      y
    );
}


function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number
): void {

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.primary)
    .text(
      title.toUpperCase(),
      MARGIN,
      y,
      {
        width: CONTENT_WIDTH,
      }
    );
}


// ============================================================
// DOCTOR + PATIENT
// ============================================================

function drawDoctorPatient(
  doc: PDFKit.PDFDocument,
  data: PrescriptionPDFData,
  y: number
): void {

  const gap = 15;

  const cardWidth =
    (CONTENT_WIDTH - gap) / 2;


  // ----------------------------------------------------------
  // Doctor
  // ----------------------------------------------------------

  drawCard(
    doc,
    MARGIN,
    y,
    cardWidth,
    120
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.primary)
    .text(
      "DOCTOR INFORMATION",
      MARGIN + 15,
      y + 15
    );

  drawLabelValue(
    doc,
    "Name:",
    data.doctorName,
    MARGIN + 15,
    y + 42
  );

  drawLabelValue(
    doc,
    "Email:",
    data.doctorEmail,
    MARGIN + 15,
    y + 62
  );

  drawLabelValue(
    doc,
    "Specialty:",
    data.doctorSpecialization,
    MARGIN + 15,
    y + 82
  );

  drawLabelValue(
    doc,
    "Phone:",
    data.doctorPhone,
    MARGIN + 15,
    y + 102
  );


  // ----------------------------------------------------------
  // Patient
  // ----------------------------------------------------------

  const patientX =
    MARGIN + cardWidth + gap;

  drawCard(
    doc,
    patientX,
    y,
    cardWidth,
    120
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.primary)
    .text(
      "PATIENT INFORMATION",
      patientX + 15,
      y + 15
    );

  drawLabelValue(
    doc,
    "Name:",
    data.patientName,
    patientX + 15,
    y + 42
  );

  drawLabelValue(
    doc,
    "Email:",
    data.patientEmail,
    patientX + 15,
    y + 62
  );

  drawLabelValue(
    doc,
    "Age:",
    data.patientAge,
    patientX + 15,
    y + 82
  );

  drawLabelValue(
    doc,
    "Gender:",
    data.patientGender,
    patientX + 15,
    y + 102
  );
}


// ============================================================
// PRESCRIPTION DETAILS
// ============================================================

function drawPrescriptionDetails(
  doc: PDFKit.PDFDocument,
  data: PrescriptionPDFData,
  y: number
): void {

  drawSectionTitle(
    doc,
    "Prescription Details",
    y
  );

  const boxY = y + 20;

  drawCard(
    doc,
    MARGIN,
    boxY,
    CONTENT_WIDTH,
    82
  );

  drawLabelValue(
    doc,
    "Prescription ID:",
    data.prescriptionId,
    MARGIN + 15,
    boxY + 14,
    90
  );

  drawLabelValue(
    doc,
    "Issued:",
    data.issuedDate,
    MARGIN + 280,
    boxY + 14
  );

  drawLabelValue(
    doc,
    "Appointment:",
    data.appointmentDate,
    MARGIN + 15,
    boxY + 37,
    90
  );

  drawLabelValue(
    doc,
    "Follow-up:",
    data.followUpDate,
    MARGIN + 280,
    boxY + 37
  );

  drawLabelValue(
    doc,
    "Diagnosis:",
    data.diagnosis,
    MARGIN + 15,
    boxY + 60,
    90
  );
}


// ============================================================
// MEDICATION TABLE
// ============================================================

function drawMedicationTable(
  doc: PDFKit.PDFDocument,
  data: PrescriptionPDFData,
  y: number
): void {

  drawSectionTitle(
    doc,
    "Medications",
    y
  );

  const tableY = y + 20;

  const columns = {
    number: 35,
    medicine: 145,
    dosage: 85,
    frequency: 110,
    duration: 120,
  };

  const headerHeight = 26;
  const rowHeight = 28;


  // Header

  doc
    .rect(
      MARGIN,
      tableY,
      CONTENT_WIDTH,
      headerHeight
    )
    .fillColor(COLORS.primary)
    .fill();


  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.white);


  let x = MARGIN;

  doc.text(
    "#",
    x + 8,
    tableY + 8,
    {
      width: columns.number - 10,
    }
  );

  x += columns.number;

  doc.text(
    "Medicine",
    x + 5,
    tableY + 8,
    {
      width: columns.medicine - 10,
    }
  );

  x += columns.medicine;

  doc.text(
    "Dosage",
    x + 5,
    tableY + 8,
    {
      width: columns.dosage - 10,
    }
  );

  x += columns.dosage;

  doc.text(
    "Frequency",
    x + 5,
    tableY + 8,
    {
      width: columns.frequency - 10,
    }
  );

  x += columns.frequency;

  doc.text(
    "Duration",
    x + 5,
    tableY + 8,
    {
      width: columns.duration - 10,
    }
  );


  // Rows

  data.medicines.forEach(
    (medicine, index) => {

      const rowY =
        tableY +
        headerHeight +
        index * rowHeight;


      if (index % 2 === 0) {

        doc
          .rect(
            MARGIN,
            rowY,
            CONTENT_WIDTH,
            rowHeight
          )
          .fillColor(COLORS.light)
          .fill();
      }


      doc
        .rect(
          MARGIN,
          rowY,
          CONTENT_WIDTH,
          rowHeight
        )
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke();


      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.text);


      let x = MARGIN;


      doc.text(
        String(index + 1),
        x + 8,
        rowY + 8,
        {
          width: columns.number - 10,
        }
      );

      x += columns.number;


      doc.text(
        medicine.name,
        x + 5,
        rowY + 8,
        {
          width: columns.medicine - 10,
        }
      );

      x += columns.medicine;


      doc.text(
        medicine.dosage,
        x + 5,
        rowY + 8,
        {
          width: columns.dosage - 10,
        }
      );

      x += columns.dosage;


      doc.text(
        medicine.frequency,
        x + 5,
        rowY + 8,
        {
          width: columns.frequency - 10,
        }
      );

      x += columns.frequency;


      doc.text(
        medicine.duration,
        x + 5,
        rowY + 8,
        {
          width: columns.duration - 10,
        }
      );
    }
  );
}


// ============================================================
// INSTRUCTIONS
// ============================================================

function drawInstructions(
  doc: PDFKit.PDFDocument,
  data: PrescriptionPDFData,
  y: number
): void {

  drawSectionTitle(
    doc,
    "Instructions",
    y
  );

  const boxY = y + 20;

  const padding = 15;

  const textWidth =
    CONTENT_WIDTH -
    padding * 2;


  // Set font BEFORE measuring.

  doc
    .font("Helvetica")
    .fontSize(9);


  const textHeight =
    doc.heightOfString(
      data.instructions,
      {
        width: textWidth,
        lineGap: 2,
      }
    );


  const boxHeight =
    textHeight +
    padding * 2;


  drawCard(
    doc,
    MARGIN,
    boxY,
    CONTENT_WIDTH,
    boxHeight
  );


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      data.instructions,
      MARGIN + padding,
      boxY + padding,
      {
        width: textWidth,
        lineGap: 2,
      }
    );
}


// ============================================================
// SIGNATURE
// ============================================================

function drawSignature(
  doc: PDFKit.PDFDocument,
  data: PrescriptionPDFData,
  y: number
): void {

  const signatureWidth = 150;

  const signatureX =
    PAGE_WIDTH -
    MARGIN -
    signatureWidth;


  doc
    .moveTo(
      signatureX,
      y
    )
    .lineTo(
      signatureX + signatureWidth,
      y
    )
    .lineWidth(0.8)
    .strokeColor(COLORS.text)
    .stroke();


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      "Doctor's Signature",
      signatureX,
      y + 8,
      {
        width: signatureWidth,
        align: "center",
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      data.doctorName,
      signatureX,
      y + 25,
      {
        width: signatureWidth,
        align: "center",
      }
    );
}


// ============================================================
// MAIN PDF GENERATOR
// ============================================================

export async function generatePrescriptionPDF(
  data: PrescriptionPDFData
): Promise<Buffer> {

  return new Promise(
    (resolve, reject) => {

      try {

        const doc = new PDFDocument({
          size: "A4",
          margin: MARGIN,
          autoFirstPage: true,
        });


        const chunks: Buffer[] = [];


        doc.on(
          "data",
          (chunk: Buffer) => {
            chunks.push(chunk);
          }
        );


        doc.on(
          "end",
          () => {

            const pdfBuffer =
              Buffer.concat(chunks);

            resolve(pdfBuffer);
          }
        );


        doc.on(
          "error",
          (error) => {
            reject(error);
          }
        );


        // ----------------------------------------------------
        // DRAW PDF
        // ----------------------------------------------------

        drawHeader(doc);

        drawDoctorPatient(
          doc,
          data,
          135
        );

        drawPrescriptionDetails(
          doc,
          data,
          275
        );

        drawMedicationTable(
          doc,
          data,
          385
        );

        drawInstructions(
          doc,
          data,
          560
        );

        drawSignature(
          doc,
          data,
          690
        );

        drawFooter(doc);


        // ----------------------------------------------------
        // FINISH
        // ----------------------------------------------------

        doc.end();

      } catch (error) {

        reject(error);
      }
    }
  );
}
