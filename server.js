const express = require("express");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join("/tmp", "careercraft-data");
const ORDER_FILE = path.join(DATA_DIR, "orders.json");
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");

fs.mkdirSync(DATA_DIR, { recursive: true });
app.use(express.json({ limit: "8mb", verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDER_FILE, "utf8")); }
  catch { return {}; }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDER_FILE, JSON.stringify(orders, null, 2));
}
function clean(value, max = 3000) {
  return String(value || "").trim().slice(0, max);
}

function suggestedSkills(role) {
  const r = String(role || "").toLowerCase();
  if (/admin|secretary|office|reception/.test(r)) return ["Communication", "Organisation", "Time management", "Record keeping", "Customer service", "Computer literacy"];
  if (/teacher|education|tutor/.test(r)) return ["Communication", "Lesson preparation", "Classroom support", "Patience", "Organisation", "Learner engagement"];
  if (/sales|marketing|business development/.test(r)) return ["Customer relations", "Communication", "Product presentation", "Negotiation", "Teamwork", "Goal orientation"];
  if (/account|finance|cashier|bank/.test(r)) return ["Numeracy", "Attention to detail", "Record keeping", "Confidentiality", "Computer literacy", "Customer service"];
  if (/driver|delivery|logistic|warehouse/.test(r)) return ["Time management", "Safety awareness", "Route planning", "Reliability", "Teamwork", "Record keeping"];
  if (/nurse|health|care|clinic/.test(r)) return ["Communication", "Compassionate service", "Attention to detail", "Teamwork", "Confidentiality", "Organisation"];
  if (/it|software|computer|technician|developer/.test(r)) return ["Problem solving", "Technical support", "Troubleshooting", "Communication", "Teamwork", "Continuous learning"];
  return ["Communication", "Teamwork", "Problem solving", "Time management", "Organisation", "Willingness to learn"];
}


function listItems(value, splitInline = false) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  // Accept pasted numbered clauses whether they arrive on separate lines or
  // as one continuous paragraph (for example: "1. Rent ... 2. Use and care ...").
  const normalized = raw
    .replace(/\r\n?/g, "\n")
    .replace(/([^\n])\s+(?=\d{1,2}[.)]\s+[A-Za-z])/g, "$1\n");
  let items = normalized.split(/\n+/)
    .map(item => item.replace(/^\s*(?:[-*•▪]|\d{1,2}[.)])\s*/, "").trim())
    .filter(Boolean);

  if (items.length === 1 && splitInline && /[·,;]/.test(items[0])) {
    items = items[0].split(/[·,;]/).map(item => item.trim()).filter(Boolean);
  }
  return items;
}
function cvRows(value, kind) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const splitRow = line => line.split(/\s*\|\s*|\t+|\s+;\s*/).map(x => x.trim()).filter(Boolean);
  const explicit = lines.map(splitRow);
  if (explicit.length && explicit.every(row => row.length >= 3)) {
    return explicit.map(row => {
      const yearFirst = /\b(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|present|current))?\b/i.test(row[0]);
      return kind === "experience"
        ? (yearFirst ? [row[1], row[2], row[0]] : [row[0], row[1], row[2]])
        : (yearFirst ? [row[1], row[2], row[0]] : [row[0], row[1], row[2]]);
    });
  }
  const flat = lines.flatMap(line => line.split(/\s*\|\s*|\t+/).map(x => x.trim()).filter(Boolean));
  const rows = [];
  for (let i = 0; i + 2 < flat.length; i += 3) {
    const yearFirst = /\b(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|present|current))?\b/i.test(flat[i]);
    rows.push(yearFirst ? [flat[i+1], flat[i+2], flat[i]] : [flat[i], flat[i+1], flat[i+2]]);
  }
  if (!rows.length) rows.push([flat[0] || "", flat[1] || "", flat[2] || ""]);
  return rows;
}

function drawCvTable(doc, heading, value, kind, bodySize = 12, headingSize = 14) {
  if (!String(value || "").trim()) return;
  if (doc.y > 680) doc.addPage();
  doc.font("Times-Bold").fontSize(headingSize).fillColor("#000000").text(heading);
  doc.moveDown(0.35);
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const headers = kind === "experience" ? ["Company", "Position", "Year"] : ["School", "Certificate", "Year"];
  const widths = [width * 0.42, width * 0.36, width * 0.22];
  const rows = cvRows(value, kind);
  const drawCells = (cells, bold = false) => {
    const y = doc.y;
    let maxHeight = 0;
    let x = left;
    cells.forEach((cell, i) => {
      doc.font(bold ? "Times-Bold" : "Times-Roman").fontSize(bodySize).fillColor("#111827");
      const h = doc.heightOfString(String(cell || ""), { width: widths[i] - 8, lineGap: 6 });
      maxHeight = Math.max(maxHeight, h);
      doc.text(String(cell || ""), x, y, { width: widths[i] - 8, lineGap: 6 });
      x += widths[i];
    });
    doc.y = y + maxHeight + 12;
  };
  drawCells(headers, true);
  doc.moveTo(left, doc.y - 4).lineTo(left + width, doc.y - 4).strokeColor("#999999").lineWidth(0.6).stroke();
  rows.forEach(row => {
    if (doc.y > 735) {
      doc.addPage();
      drawCells(headers, true);
      doc.moveTo(left, doc.y - 4).lineTo(left + width, doc.y - 4).strokeColor("#999999").lineWidth(0.6).stroke();
    }
    drawCells(row);
  });
  doc.moveDown(0.6);
  doc.x = left;
}
function drawCvSection(doc, heading, value, accent, splitInline = false, bodySize = 12, headingSize = 14) {
  if (!String(value || "").trim()) return;
  if (doc.y > 690) doc.addPage();
  doc.font("Times-Bold").fontSize(headingSize).fillColor("#000000").text(heading);
  doc.moveDown(0.3);
  const items = listItems(value, splitInline);
  if (items.length > 1 || splitInline) {
    items.forEach(item => {
      if (doc.y > 735) doc.addPage();
      doc.font("Times-Roman").fontSize(bodySize).fillColor("#111827")
        .text("•  " + item, { indent: 8, hanging: 3, lineGap: 6 });
    });
  } else {
    doc.font("Times-Roman").fontSize(bodySize).fillColor("#111827")
      .text(items[0] || value, { lineGap: 6 });
  }
  doc.moveDown(0.8);
}


function drawTenancyAgreement(doc, d, accent, fontSize, headingSize) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  const body = 12;
  const heading = 18;
  const columnGap = 24;
  const columnWidth = (width - columnGap) / 2;
  const line = "........................................................";

  const paragraph = (value, options = {}) => {
    doc.font("Times-Roman").fontSize(body).fillColor("#111111")
      .text(value, { width, lineGap: 3, ...options });
  };

  doc.font("Times-Bold").fontSize(heading).fillColor("#000000")
    .text("TENANCY AGREEMENT", { width, align: "center" });
  doc.moveDown(1.4);

  paragraph("This Tenancy Agreement is made this _____ day of __________, 20____, between " +
    (d.landlord || "____________________________") +
    ", hereinafter referred to as the Landlord, and " +
    (d.tenant || "____________________________") +
    ", hereinafter referred to as the Tenant.", { align: "justify" });
  doc.moveDown(0.9);

  paragraph("The Landlord hereby agrees to rent out to the Tenant the property situated at " +
    (d.propertyAddress || "________________________________________") +
    " for residential purposes.", { align: "justify" });
  doc.moveDown(0.8);

  paragraph("The Tenant agrees to occupy the property for a period of " +
    (d.period || "____________") +
    ", commencing on the _____ day of __________, 20____, and ending on the _____ day of __________, 20____.",
    { align: "justify" });
  doc.moveDown(0.8);

  paragraph("The Tenant agrees to pay rent in the sum of GH₵ " +
    (d.rent || "____________") +
    " for the agreed tenancy period. The rent shall be paid to the Landlord through an agreed payment method and within the stipulated period.",
    { align: "justify" });
  doc.moveDown(1.1);

  doc.font("Times-Bold").fontSize(heading).fillColor("#000000")
    .text("TERMS AND CONDITION");
  doc.moveDown(0.7);

  const clauses = listItems(d.terms || "");
  clauses.forEach((clause, index) => {
    if (index === 9) doc.addPage();
    const cleanClause = clause.replace(/^\s*\d{1,2}[.)]\s*/, "");
    doc.font("Times-Roman").fontSize(body).fillColor("#111111")
      .text((index + 1) + ". " + cleanClause, {
        width, lineGap: 3, align: "left"
      });
    doc.moveDown(0.65);
  });

  // Keep the closing and signatures together rather than letting them split awkwardly.
  if (doc.y > 625) doc.addPage();
  doc.moveDown(0.6);
  paragraph("IN WITNESS WHEREOF, both parties have agreed to the terms and conditions stated above and have signed this agreement on the date first written above.",
    { align: "justify" });
  doc.moveDown(1.6);

  const signatureY = doc.y;
  doc.font("Times-Roman").fontSize(body).fillColor("#111111");
  doc.text(line, left, signatureY, { width: columnWidth });
  doc.text(line, left + columnWidth + columnGap, signatureY, { width: columnWidth });
  const namesY = signatureY + 17;
  doc.text("NAME OF LANDLADY\nNUMBER", left, namesY, { width: columnWidth, lineGap: 2 });
  doc.text("NAME OF TENANT\nNUMBER", left + columnWidth + columnGap, namesY, { width: columnWidth, lineGap: 2 });

  const witnessHeadingY = namesY + 43;
  doc.font("Times-Bold").fontSize(body).fillColor("#000000")
    .text("WITNESSES", left, witnessHeadingY, { width });
  const witnessLineY = witnessHeadingY + 28;
  doc.font("Times-Roman").fontSize(body).fillColor("#111111");
  doc.text(line, left, witnessLineY, { width: columnWidth });
  doc.text(line, left + columnWidth + columnGap, witnessLineY, { width: columnWidth });
  const witnessNamesY = witnessLineY + 17;
  const witnessLabel = "NAME OF WITNESS (OR LEAVE A LINE)\nNUMBER (OR LEAVE A LINE)";
  doc.text(witnessLabel, left, witnessNamesY, { width: columnWidth, lineGap: 2 });
  doc.text(witnessLabel, left + columnWidth + columnGap, witnessNamesY, { width: columnWidth, lineGap: 2 });
}

function makePdf(order, outputOverride = null, watermark = false) {
  return new Promise((resolve, reject) => {
    const output = outputOverride || path.join(DATA_DIR, order.token + ".pdf");
    const doc = new PDFDocument({ size: "A4", margins: { top: 72, bottom: 72, left: 72, right: 72 } });
    const stream = fs.createWriteStream(output);
    doc.pipe(stream);
    if (watermark) {
      const stamp = () => {
        const savedX = doc.x;
        const savedY = doc.y;
        doc.save();
        doc.fillColor("#a0a0a0").opacity(0.16).font("Times-Bold").fontSize(27)
          .rotate(-32, { origin: [297, 421] })
          .text("UNPAID PREVIEW", 75, 390, { width: 450, align: "center", lineBreak: false });
        doc.restore();
        // Drawing the watermark must never move the document's text cursor.
        doc.x = savedX;
        doc.y = savedY;
      };
      doc.on("pageAdded", stamp);
      stamp();
    }
    const d = order.data;
    const fontSize=Math.max(10,Math.min(14,Number(d.fontSize)||12));
    const headingSize=Math.max(12,Math.min(16,Number(d.headingSize)||14));
    const themeMap={plain:'#222222',navy:'#263b68',green:'#17675e',burgundy:'#783b4b',charcoal:'#353535',sand:'#80604b',purple:'#7544dc'};
    const palette=["#263b68","#315d72","#80604b","#41414b","#7544dc","#17675e","#252b38","#8a593c","#44516a","#365d86","#245b70","#6a4d7c","#3f5960","#9a563d","#4d547d","#353535","#183f68","#7b5a49","#285b50","#63438d","#24527a","#8b5e3c","#355c7d","#6c477b","#3b6d68","#a05a45","#34495e","#94724d","#526b8c","#56436d"];
    const designNumber=Math.max(1,Math.min(30,Number(String(d.template||"").split("-").pop())||1));
    const plainDesign=designNumber>=18;
    const accent=themeMap[d.pageTheme]||(plainDesign?"#222222":palette[designNumber-1]);
    if(d.watermarkEnabled&&clean(d.watermarkText,32)){const mark=()=>doc.save().fillColor(accent).opacity(.10).font("Times-Bold").fontSize(38).rotate(-32,{origin:[297,421]}).text(clean(d.watermarkText,32),55,390,{width:480,align:"center"}).restore();doc.on("pageAdded",mark);mark();}
    const photoMatch=d.documentType==="cv" && typeof d.photoDataUrl==="string" && d.photoDataUrl.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
    if(photoMatch){try{const photoBuffer=Buffer.from(photoMatch[2],"base64");if(photoBuffer.length<5*1024*1024)doc.image(photoBuffer,455,48,{fit:[78,78]});}catch{}}
    if (d.documentType !== "letter" && d.documentType !== "tenancy") {
      doc.font("Times-Bold").fontSize(20).fillColor(plainDesign?"#222222":accent).text(clean(d.fullName || d.name || "Your Document", 100),{width:photoMatch?365:480});
      doc.moveDown(0.35);
      if (d.email || d.phone || d.location) {
        doc.font("Times-Roman").fontSize(9).fillColor("#475569").text([d.email, d.phone, d.location].filter(Boolean).join("  |  "));
      }
      doc.moveDown();
      if (!plainDesign) {
        doc.moveTo(58, doc.y).lineTo(537, doc.y).strokeColor(accent).lineWidth(designNumber%4===0?2:1).stroke();
        doc.moveDown();
      }
    }
    const sections = [
      ["PROFESSIONAL SUMMARY", d.summary],
      ["KEY SKILLS", d.skills || (d.documentType === "cv" ? suggestedSkills(d.targetRole).join(" · ") : "")],
      ["WORK EXPERIENCE", d.experience],
      ["EDUCATION", d.education],
      ["REFERENCES", d.documentType === "cv" ? (d.references || "Available upon request") : ""],
      ["ADDITIONAL DETAILS", d.extra]
    ];
    if (d.documentType === "letter") {
      const layout = (designNumber - 1) % 5;
      if (!plainDesign && (layout === 1 || layout === 3)) {
        doc.save().fillColor(accent).rect(58, 48, 54, 8).fill().restore();
        doc.font("Times-Bold").fontSize(8).fillColor("#52606a").text("APPLICATION LETTER", 120, 47);
        doc.y = 83;
      }
      doc.font("Times-Roman").fontSize(fontSize).fillColor("#111827");
      const sender = [clean(d.fullName), clean(d.location), clean(d.phone), clean(d.email)].filter(Boolean).join("\n");
      doc.text(sender, { align: plainDesign || layout !== 2 ? "right" : "left", lineGap: 3 });
      doc.moveDown(0.5);
      const applicationDate = clean(d.date, 40);
      if (applicationDate) {
        const parsedDate = new Date(applicationDate + "T12:00:00");
        const displayDate = Number.isNaN(parsedDate.getTime()) ? applicationDate : parsedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        doc.text(displayDate, { align: "right" });
      }
      doc.moveDown(1.2);
      const recipientAddress = [clean(d.recipientManager || "The HR Manager", 160), clean(d.recipientCompany, 200), clean(d.recipientPoBox, 100), clean(d.recipientLocation, 160)].filter(Boolean).join("\n");
       doc.text(recipientAddress || clean(d.recipient), { lineGap: 3 });
      doc.moveDown(1.5);
      doc.text("Dear Sir/Madam,");
      doc.moveDown(1.2);
      doc.font("Times-Bold").fontSize(headingSize).fillColor("#000000")
        .text(clean(d.subject || "APPLICATION FOR EMPLOYMENT"), { align: !plainDesign && layout === 2 ? "left" : plainDesign ? "left" : "center", underline: plainDesign || layout !== 2 });
      doc.moveDown(1.2);
      const letterBody = clean(d.body, 12000)
        .replace(/^\s*Dear\s+(?:Hiring\s+Manager|Sir\/Madam|Mr\.?|Mrs\.?|Ms\.?|[A-Z][^,\n]{1,60})\s*[,;:]?\s*/i, "")
        .replace(/\s*(?:Yours faithfully|Yours sincerely|Kind regards|Best regards)[,;:]?\s*(?:\r?\n\s*[^\r\n]+)?\s*$/i, "")
        .trim();
      if (letterBody) {
        doc.font("Times-Roman").fontSize(fontSize).fillColor("#111827")
          .text(letterBody, { lineGap: 5, align: "left" });
      }
      doc.moveDown(1.5);
      doc.text("Yours faithfully,");
      doc.moveDown(2);
      doc.font("Times-Bold").text(clean(d.fullName));
    } else if (d.documentType === "tenancy") {
      drawTenancyAgreement(doc,d,accent,fontSize,headingSize);
    } else {
      if (d.documentType === "cv") {
        drawCvSection(doc, "PROFILE", clean(d.summary, 6000), accent, false, fontSize, headingSize);
        const personal = [["Date of Birth", d.dateOfBirth], ["Place of Birth", d.placeOfBirth], ["Nationality", d.nationality], ["Language", d.language], ["Marital Status", d.maritalStatus], ["Contact", d.personalContact || d.phone]].filter(([,v]) => String(v || "").trim()).map(([k,v]) => k + ": " + v).join("\n");
        drawCvSection(doc, "PERSONAL INFORMATION", personal, accent, false, fontSize, headingSize);
        drawCvTable(doc, "EDUCATION BACKGROUND", clean(d.education, 6000), "education", fontSize, headingSize);
        drawCvTable(doc, "WORKING EXPERIENCE", clean(d.experience, 6000), "experience", fontSize, headingSize);
        drawCvSection(doc, "SKILLS", clean(d.skills || suggestedSkills(d.targetRole).join("\n"), 6000), accent, true, fontSize, headingSize);
        drawCvSection(doc, "INTEREST AND HOBBIES", clean(d.interests, 3000), accent, true, fontSize, headingSize);
        drawCvSection(doc, "REFERENCE", clean(d.references || "Available upon request", 1000), accent, false, fontSize, headingSize);
      } else {
        sections.forEach(([heading, value]) => {
          if (value) {
            doc.font("Times-Bold").fontSize(headingSize).fillColor("#000000").text(heading);
            doc.moveDown(0.25);
            doc.font("Times-Roman").fontSize(fontSize).fillColor("#111827").text(clean(value, 6000), { lineGap: 3 });
            doc.moveDown();
          }
        });
      }
    }
    doc.end();
    stream.on("finish", () => resolve(output));
    stream.on("error", reject);
  });
}

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "CareerCraft" }));

app.post("/api/preview", async (req, res) => {
  const previewId = crypto.randomBytes(16).toString("hex");
  const output = path.join(DATA_DIR, "preview-" + previewId + ".pdf");
  try {
    const input = req.body || {};
    const data = {
      documentType: clean(input.documentType, 20), template: clean(input.template, 40),
      fullName: clean(input.fullName, 100), email: clean(input.email, 150),
      phone: clean(input.phone, 40), location: clean(input.location, 120),
      targetRole: clean(input.targetRole, 120), dateOfBirth: clean(input.dateOfBirth, 40), placeOfBirth: clean(input.placeOfBirth, 120), nationality: clean(input.nationality, 80), language: clean(input.language, 120), maritalStatus: clean(input.maritalStatus, 60), personalContact: clean(input.personalContact, 60), interests: clean(input.interests, 3000), references: clean(input.references, 1000), pageTheme: clean(input.pageTheme,20), fontSize: Number(input.fontSize)||12, headingSize: Number(input.headingSize)||14, watermarkEnabled: input.watermarkEnabled===true, watermarkText: clean(input.watermarkText,32),
      summary: clean(input.summary), experience: clean(input.experience),
      education: clean(input.education), skills: clean(input.skills), extra: clean(input.extra),
      date: clean(input.date, 40), recipient: clean(input.recipient), recipientManager: clean(input.recipientManager, 160), recipientCompany: clean(input.recipientCompany, 200), recipientPoBox: clean(input.recipientPoBox, 100), recipientLocation: clean(input.recipientLocation, 160), subject: clean(input.subject), body: clean(input.body, 12000),
      landlord: clean(input.landlord), tenant: clean(input.tenant),
      propertyAddress: clean(input.propertyAddress), rent: clean(input.rent),
      period: clean(input.period), terms: clean(input.terms, 6000),
      photoDataUrl: typeof input.photoDataUrl === "string" ? input.photoDataUrl.slice(0, 700000) : ""
    };
    if (!data.fullName) return res.status(400).json({ error: "Enter your name before previewing." });
    await makePdf({ token: previewId, data }, output, true);
    res.setHeader("Cache-Control", "no-store");
    res.json({ url: "/api/preview/" + previewId });
  } catch (error) {
    fs.promises.unlink(output).catch(() => {});
    res.status(500).json({ error: "Could not create the PDF preview. Please try again." });
  }
});

app.get("/api/preview/:id", (req, res) => {
  const id = String(req.params.id || "");
  if (!/^[a-f0-9]{32}$/.test(id)) return res.status(404).end("Preview not found.");
  const file = path.join(DATA_DIR, "preview-" + id + ".pdf");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", 'inline; filename="CareerCraft-unpaid-preview.pdf"');
  res.type("application/pdf");
  res.sendFile(file, error => {
    fs.promises.unlink(file).catch(() => {});
    if (error && !res.headersSent) res.status(404).end("This preview has expired. Please create a new one.");
  });
});

app.post("/api/payments/initialize", async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ error: "Payments are not configured yet. Please try again later." });
    const data = req.body || {};
    if (!clean(data.fullName || data.name, 100)) return res.status(400).json({ error: "Please enter your name." });
    const email = clean(data.email, 150);
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address for your receipt." });
    const reference = "CC_" + crypto.randomBytes(12).toString("hex");
    const token = crypto.randomBytes(24).toString("hex");
    const order = { reference, token, status: "pending", createdAt: new Date().toISOString(), data: {
      documentType: clean(data.documentType, 20), template: clean(data.template, 40),
      fullName: clean(data.fullName || data.name, 100), email, phone: clean(data.phone, 40),
      location: clean(data.location, 120), targetRole: clean(data.targetRole, 120), dateOfBirth: clean(data.dateOfBirth, 40), placeOfBirth: clean(data.placeOfBirth, 120), nationality: clean(data.nationality, 80), language: clean(data.language, 120), maritalStatus: clean(data.maritalStatus, 60), personalContact: clean(data.personalContact, 60), interests: clean(data.interests, 3000), pageTheme: clean(data.pageTheme,20), fontSize: Number(data.fontSize)||12, headingSize: Number(data.headingSize)||14, watermarkEnabled: data.watermarkEnabled===true, watermarkText: clean(data.watermarkText,32),
      references: clean(data.references, 1000), summary: clean(data.summary), experience: clean(data.experience),
      education: clean(data.education), skills: clean(data.skills), extra: clean(data.extra),
      recipient: clean(data.recipient), recipientManager: clean(data.recipientManager, 160), recipientCompany: clean(data.recipientCompany, 200), recipientPoBox: clean(data.recipientPoBox, 100), recipientLocation: clean(data.recipientLocation, 160), subject: clean(data.subject), body: clean(data.body, 12000),
      date: clean(data.date), landlord: clean(data.landlord), tenant: clean(data.tenant),
      propertyAddress: clean(data.propertyAddress), rent: clean(data.rent), period: clean(data.period), terms: clean(data.terms, 6000), photoDataUrl: typeof data.photoDataUrl === "string" ? data.photoDataUrl.slice(0, 700000) : ""
    }};
    const orders = readOrders();
    orders[reference] = order;
    writeOrders(orders);
    const callbackUrl = (PUBLIC_URL || req.protocol + "://" + req.get("host")) + "/payment/callback";
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: 1000, currency: "GHS", reference, callback_url: callbackUrl, metadata: { app: "CareerCraft", documentType: order.data.documentType } })
    });
    const result = await response.json();
    if (!response.ok || !result.status) throw new Error(result.message || "Could not start payment.");
    res.json({ authorization_url: result.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: error.message || "Payment could not be started." });
  }
});

async function verifyPayment(reference) {
  const response = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), {
    headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY }
  });
  const result = await response.json();
  return response.ok && result.status && result.data && result.data.status === "success" &&
    result.data.currency === "GHS" && Number(result.data.amount) === 1000 &&
    result.data.reference === reference;
}

app.get("/payment/callback", async (req, res) => {
  try {
    const reference = clean(req.query.reference, 100);
    const orders = readOrders();
    const order = orders[reference];
    if (!order) return res.status(404).send("We could not find this CareerCraft order. Please contact support.");
    if (order.status !== "paid") {
      if (!process.env.PAYSTACK_SECRET_KEY || !(await verifyPayment(reference))) {
        return res.status(402).send("Payment has not been confirmed. Do not pay again yet. Contact support with reference: " + reference);
      }
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      await makePdf(order);
      orders[reference] = order;
      writeOrders(orders);
    }
    res.redirect("/success.html?access=" + encodeURIComponent(order.token));
  } catch (error) {
    res.status(500).send("Payment was received or is being checked, but document preparation needs support. Please contact us with your payment reference.");
  }
});

app.get("/api/orders/:token", (req, res) => {
  const orders = readOrders();
  const order = Object.values(orders).find(item => item.token === req.params.token);
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json({ status: order.status, name: order.data.fullName, documentType: order.data.documentType });
});

app.get("/download/:token", (req, res) => {
  const orders = readOrders();
  const order = Object.values(orders).find(item => item.token === req.params.token);
  if (!order || order.status !== "paid") return res.status(404).send("This document is not available.");
  const file = path.join(DATA_DIR, order.token + ".pdf");
  if (!fs.existsSync(file)) return res.status(404).send("PDF is being prepared. Refresh this page shortly.");
  res.download(file, "CareerCraft-" + order.data.fullName.replace(/[^a-z0-9-_]/gi, "-") + ".pdf");
});


app.get("/print/:token", (req, res) => {
  const orders = readOrders();
  const order = Object.values(orders).find(item => item.token === req.params.token);
  if (!order || order.status !== "paid") return res.status(404).send("This document is not available for printing.");
  const file = path.join(DATA_DIR, order.token + ".pdf");
  if (!fs.existsSync(file)) return res.status(404).send("PDF is being prepared. Refresh this page shortly.");
  res.type("application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="CareerCraft-' + order.data.fullName.replace(/[^a-z0-9-_]/gi, "-") + '.pdf"');
  res.sendFile(file);
});

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers["x-paystack-signature"];
  if (!secret || !signature) return res.sendStatus(401);
  const expected = crypto.createHmac("sha512", secret).update(req.rawBody || Buffer.alloc(0)).digest("hex");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.sendStatus(401);
  try {
    const event = JSON.parse((req.rawBody || Buffer.alloc(0)).toString());
    if (event.event === "charge.success" && event.data && event.data.reference && await verifyPayment(event.data.reference)) {
      const orders = readOrders();
      const order = orders[event.data.reference];
      if (order && order.status !== "paid") {
        order.status = "paid";
        order.paidAt = new Date().toISOString();
        await makePdf(order);
        orders[event.data.reference] = order;
        writeOrders(orders);
      }
    }
    res.sendStatus(200);
  } catch { res.sendStatus(400); }
});

app.listen(PORT, () => console.log("CareerCraft running on port " + PORT));