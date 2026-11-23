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
  let items = raw.split(/\r?\n+/).map(item => item.replace(/^\s*(?:[-*•▪]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  if (items.length === 1 && splitInline && /[·,;]/.test(items[0])) {
    items = items[0].split(/[·,;]/).map(item => item.trim()).filter(Boolean);
  }
  return items;
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
        .text("•  " + item, { indent: 8, hanging: 3, lineGap: 3 });
    });
  } else {
    doc.font("Times-Roman").fontSize(bodySize).fillColor("#111827")
      .text(items[0] || value, { lineGap: 3 });
  }
  doc.moveDown(0.8);
}


function drawTenancyAgreement(doc,d,accent,fontSize,headingSize){
 const left=58,right=537,width=right-left,body=fontSize;
 const field=(label,value)=>{doc.font("Times-Roman").fontSize(body).fillColor("#111111").text(label+" "+(value||"________________________________"),{width,lineGap:3});doc.moveDown(0.65);};
 doc.font("Times-Bold").fontSize(headingSize+4).fillColor(accent).text("TENANCY AGREEMENT",{align:"center"});doc.moveDown(2);
 doc.font("Times-Roman").fontSize(body).fillColor("#111111").text("This Tenancy Agreement is made this _____ day of __________, 20____, between "+(d.landlord||"____________________________")+", hereinafter referred to as the Landlord, and "+(d.tenant||"____________________________")+", hereinafter referred to as the Tenant.",{width,lineGap:3,align:"justify"});doc.moveDown(1);
 field("The Landlord hereby agrees to rent out to the Tenant the property situated at",d.propertyAddress||"________________________________________ for residential purposes.");
 field("The Tenant agrees to occupy the property for a period of",d.period);
 field("The Tenant agrees to pay rent in the sum of GH₵",d.rent);
 doc.font("Times-Roman").fontSize(body).text("The rent shall be paid to the Landlord through an agreed payment method and within the stipulated period.",{width,lineGap:3,align:"justify"});doc.moveDown(1.6);
 doc.font("Times-Bold").fontSize(headingSize).fillColor("#000000").text("TERMS AND CONDITIONS");doc.moveDown(0.9);
 const clauses=listItems(d.terms||"");
 clauses.forEach((clause,i)=>{
   const clauseText=(i+1)+".  "+clause.replace(/^\s*\d+[.)]\s*/,"");
   const opts={width:width-8,indent:8,hanging:4,lineGap:3,align:"justify"};
   doc.font("Times-Roman").fontSize(body).fillColor("#111111");
   const required=doc.heightOfString(clauseText,opts)+18;
   const bottom=doc.page.height-doc.page.margins.bottom;
   if(doc.y+required>bottom) doc.addPage();
   doc.text(clauseText,opts);
   doc.moveDown(0.85);
 });
 if(doc.y>620)doc.addPage();doc.moveDown(1.5);
 doc.font("Times-Roman").fontSize(body).fillColor("#111111").text("IN WITNESS WHEREOF, both parties have agreed to the terms and conditions stated above and have signed this agreement on the date first written above.",{width,lineGap:3,align:"justify"});doc.moveDown(4);
 const y=doc.y,row1=54,row2=88,half=width/2;doc.rect(left,y,half,row1+row2).strokeColor("#777777").lineWidth(.8).stroke();doc.moveTo(left+half,y).lineTo(left+half,y+row1+row2).stroke();doc.moveTo(left,y+row1).lineTo(right,y+row1).stroke();
 doc.font("Times-Roman").fontSize(10).fillColor("#111111").text("........................................................\nNAME OF LANDLADY\nNUMBER",left+7,y+8,{width:half-14,lineGap:2}).text("........................................................\nNAME OF TENANT\nNUMBER",left+half+7,y+8,{width:half-14,lineGap:2});
 doc.font("Times-Bold").fontSize(10).text("WITNESSES",left+7,y+row1+8);doc.font("Times-Roman").fontSize(9.5).text(".........................................................\nNAME OF WITNESS (OR LEAVE A LINE)\nNUMBER (OR LEAVE A LINE)",left+7,y+row1+34,{width:half-14,lineGap:2}).text(".........................................................\nNAME OF WITNESS (OR LEAVE A LINE)\nNUMBER (OR LEAVE A LINE)",left+half+7,y+row1+34,{width:half-14,lineGap:2});
}

function makePdf(order, outputOverride = null, watermark = false) {
  return new Promise((resolve, reject) => {
    const output = outputOverride || path.join(DATA_DIR, order.token + ".pdf");
    const doc = new PDFDocument({ size: "A4", margins: { top: 54, bottom: 54, left: 58, right: 58 } });
    const stream = fs.createWriteStream(output);
    doc.pipe(stream);
    if (watermark) {
      const stamp = () => { doc.save().fillColor("#a0a0a0").opacity(0.22).font("Times-Bold").fontSize(34).rotate(-32, { origin: [297, 421] }).text("UNPAID PREVIEW", 75, 390, { width: 450, align: "center" }).restore(); };
      doc.on("pageAdded", stamp);
      stamp();
    }
    const d = order.data;
    const fontSize=Math.max(10,Math.min(14,Number(d.fontSize)||12));
    const headingSize=Math.max(12,Math.min(16,Number(d.headingSize)||14));
    const themeMap={plain:'#222222',navy:'#263b68',green:'#17675e',burgundy:'#783b4b',charcoal:'#353535',sand:'#80604b',purple:'#7544dc'};
    const palette=["#263b68","#315d72","#80604b","#41414b","#7544dc","#17675e","#252b38","#8a593c","#44516a","#365d86","#245b70","#6a4d7c","#3f5960","#9a563d","#4d547d","#353535","#183f68","#7b5a49","#285b50","#63438d"];
    const designNumber=Math.max(1,Math.min(20,Number(String(d.template||"").split("-").pop())||1));
    const plainDesign=designNumber>=18;
    const accent=themeMap[d.pageTheme]||(plainDesign?"#222222":palette[designNumber-1]);
    if(d.watermarkEnabled&&clean(d.watermarkText,32)){const mark=()=>doc.save().fillColor(accent).opacity(.10).font("Times-Bold").fontSize(38).rotate(-32,{origin:[297,421]}).text(clean(d.watermarkText,32),55,390,{width:480,align:"center"}).restore();doc.on("pageAdded",mark);mark();}
    const photoMatch=d.documentType==="cv" && typeof d.photoDataUrl==="string" && d.photoDataUrl.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
    if(photoMatch){try{const photoBuffer=Buffer.from(photoMatch[2],"base64");if(photoBuffer.length<5*1024*1024)doc.image(photoBuffer,455,48,{fit:[78,78]});}catch{}}
    if (d.documentType !== "letter") {
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
      doc.moveDown(1.5);
      doc.text(clean(d.recipient), { lineGap: 3 });
      doc.moveDown(1.5);
      doc.text("Dear Sir/Madam,");
      doc.moveDown(1.2);
      doc.font("Times-Bold").fontSize(headingSize).fillColor("#000000")
        .text(clean(d.subject || "APPLICATION FOR EMPLOYMENT"), { align: !plainDesign && layout === 2 ? "left" : plainDesign ? "left" : "center", underline: plainDesign || layout !== 2 });
      doc.moveDown(1.2);
      doc.font("Times-Roman").fontSize(fontSize).fillColor("#111827")
        .text(clean(d.body, 12000), { lineGap: 5, align: "left" });
      doc.moveDown(1.5);
      doc.text("Yours faithfully,");
      doc.moveDown(2);
      doc.font("Times-Bold").text(clean(d.fullName));
    } else if (d.documentType === "tenancy") {
      drawTenancyAgreement(doc,d,accent,fontSize,headingSize);
    } else {
      if (d.documentType === "cv") {
        drawCvSection(doc, "PROFESSIONAL SUMMARY", clean(d.summary, 6000), accent, false, fontSize, headingSize);
        drawCvSection(doc, "KEY SKILLS", clean(d.skills || suggestedSkills(d.targetRole).join("\n"), 6000), accent, true, fontSize, headingSize);
        drawCvSection(doc, "WORK EXPERIENCE", clean(d.experience, 6000), accent, false, fontSize, headingSize);
        drawCvSection(doc, "EDUCATION", clean(d.education, 6000), accent, false, fontSize, headingSize);
        drawCvSection(doc, "REFERENCES", clean(d.references || "Available upon request", 1000), accent, false, fontSize, headingSize);
        drawCvSection(doc, "ADDITIONAL DETAILS", clean(d.extra, 6000), accent, false, fontSize, headingSize);
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
      targetRole: clean(input.targetRole, 120), references: clean(input.references, 1000), pageTheme: clean(input.pageTheme,20), fontSize: Number(input.fontSize)||12, headingSize: Number(input.headingSize)||14, watermarkEnabled: input.watermarkEnabled===true, watermarkText: clean(input.watermarkText,32),
      summary: clean(input.summary), experience: clean(input.experience),
      education: clean(input.education), skills: clean(input.skills), extra: clean(input.extra),
      recipient: clean(input.recipient), subject: clean(input.subject), body: clean(input.body, 12000),
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
      location: clean(data.location, 120), targetRole: clean(data.targetRole, 120), pageTheme: clean(data.pageTheme,20), fontSize: Number(data.fontSize)||12, headingSize: Number(data.headingSize)||14, watermarkEnabled: data.watermarkEnabled===true, watermarkText: clean(data.watermarkText,32),
      references: clean(data.references, 1000), summary: clean(data.summary), experience: clean(data.experience),
      education: clean(data.education), skills: clean(data.skills), extra: clean(data.extra),
      recipient: clean(data.recipient), subject: clean(data.subject), body: clean(data.body, 12000),
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