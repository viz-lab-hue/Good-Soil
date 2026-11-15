/**
 * =========================================================================
 * GOOD SOIL — GOOGLE SHEETS LEAD CAPTURE SCRIPT
 * =========================================================================
 * 
 * Instructions (Takes ~1 minute):
 * 1. Open Google Sheets (https://sheets.new) and name it "Good Soil — Leads & Bookings"
 * 2. In the top menu, click: Extensions > Apps Script
 * 3. Delete any code in the editor, paste this entire file, and click Save (💾)
 * 4. In the top right, click "Deploy" > "New deployment"
 * 5. Click the gear icon (⚙️) next to "Select type" and choose "Web app"
 * 6. Set:
 *    - Description: "Good Soil Lead Webhook"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"
 * 7. Click "Deploy", authorize access with your Google account, and copy the "Web app URL"
 * 8. Add that URL to your Vercel project Environment Variables:
 *    - Variable Name: GOOGLE_SHEET_WEBHOOK_URL
 *    - Value: [Paste your Web app URL]
 * 
 * That's it! Every lead from the website will automatically appear in your sheet!
 * =========================================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create styled header row if row 1 is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp (IST)",
        "Lead Type",
        "Name",
        "Phone / WhatsApp",
        "Email",
        "Student Age",
        "Format / Track / Product",
        "Message / Details",
        "Status"
      ]);
      
      // Style headers in Good Soil green with bold white text
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#1F6B44");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Arial");
      sheet.setFrozenRows(1);
    }
    
    // Parse incoming payload
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    // Format timestamp in Indian Standard Time (IST)
    var istTime = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    
    var leadType = data.type || "General Lead";
    var name = data.name || data.parentName || "Anonymous";
    var phone = data.phone || data.contact || "";
    var email = data.email || "";
    var age = data.age || data.childAge || "";
    var format = data.format || data.interest || data.title || "";
    var details = data.details || data.message || "";
    var status = "New Lead";
    
    // Append the lead row to the sheet
    sheet.appendRow([
      istTime,
      leadType,
      name,
      phone,
      email,
      age,
      format,
      details,
      status
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Lead added to sheet successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Good Soil Lead Webhook is active and listening for website submissions.");
}
