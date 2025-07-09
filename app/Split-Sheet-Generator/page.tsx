"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import jsPDF from "jspdf";
// Remove Mantine/Grid imports
// import { MantineProvider } from "@mantine/core";
// import { Row, Col, Container } from "react-grid-system";

export default function SplitSheetTemplate() {

  const [form, setForm] = useState({
    songTitle: "",
    date: "",
    artists: "",
    ownership: "",
    royalty: "",
    licensing: "",
    dispute: "",
    signatures: "",
    stateCountry: "" // Added state/country field for dispute resolution
  });

  const [contributors, setContributors] = useState([
    { name: "", role: "", ownership: "", contact: "" }
  ]);
  const [publishing, setPublishing] = useState([
    { contributorName: "", publisher: "", percent: "" }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  type ContributorField = "name" | "role" | "ownership" | "contact";
  const handleContributorChange = (idx: number, field: ContributorField, value: string) => {
    setContributors(prev => {
      const arr = [...prev];
      arr[idx][field] = value;
      return arr;
    });
  };

  type PublishingField = "contributorName" | "publisher" | "percent";
  const handlePublishingChange = (idx: number, field: PublishingField, value: string) => {
    setPublishing(prev => {
      const arr = [...prev];
      arr[idx][field] = value;
      return arr;
    });
  };

  const addContributor = () => setContributors([...contributors, { name: "", role: "", ownership: "", contact: "" }]);
  const removeContributor = (idx: number) => setContributors(contributors.filter((_, i) => i !== idx));

  const addPublishing = () => setPublishing([...publishing, { contributorName: "", publisher: "", percent: "" }]);
  const removePublishing = (idx: number) => setPublishing(publishing.filter((_, i) => i !== idx));

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SPLIT SHEET AGREEMENT", 10, 15);
    doc.setFontSize(12);
    doc.text(`Song Title: ${form.songTitle}`, 10, 30);
    doc.text(`Date of Creation: ${form.date}`, 10, 40);
    doc.text(`Artist(s): ${form.artists}`, 10, 50);

    // Primary Contributors Table
    doc.text("Primary Contributors:", 10, 60);

    // Table headers
    let contributorsTableY = 65;
    doc.setFillColor(243, 244, 246);
    doc.rect(10, contributorsTableY, 40, 8, "F"); // Name
    doc.rect(50, contributorsTableY, 30, 8, "F"); // Role
    doc.rect(80, contributorsTableY, 40, 8, "F"); // Ownership %
    doc.rect(120, contributorsTableY, 70, 8, "F"); // Contact
    doc.setTextColor(0);
    doc.text("Name", 12, contributorsTableY + 6);
    doc.text("Role", 52, contributorsTableY + 6);
    doc.text("Ownership %", 82, contributorsTableY + 6);
    doc.text("Contact", 122, contributorsTableY + 6);

    // Table rows
    let contributorsRowY = contributorsTableY + 8;
    contributors.forEach((c) => {
      doc.rect(10, contributorsRowY, 40, 8);
      doc.rect(50, contributorsRowY, 30, 8);
      doc.rect(80, contributorsRowY, 40, 8);
      doc.rect(120, contributorsRowY, 70, 8);
      doc.text(c.name || "", 12, contributorsRowY + 6);
      doc.text(c.role || "", 52, contributorsRowY + 6);
      doc.text(c.ownership || "", 82, contributorsRowY + 6);
      doc.text(c.contact || "", 122, contributorsRowY + 6);
      contributorsRowY += 8;
    });

    // Publishing Details Table
    let pubStartY = contributorsRowY + 10;
    doc.text("Publishing Details:", 10, pubStartY);

    // Table headers
    let publishingTableY = pubStartY + 5;
    doc.setFillColor(243, 244, 246);
    doc.rect(10, publishingTableY, 60, 8, "F"); // Contributor Name
    doc.rect(70, publishingTableY, 70, 8, "F"); // Publisher
    doc.rect(140, publishingTableY, 50, 8, "F"); // Publishing %
    doc.setTextColor(0);
    doc.text("Contributor Name", 12, publishingTableY + 6);
    doc.text("Publisher", 72, publishingTableY + 6);
    doc.text("Publishing %", 142, publishingTableY + 6);

    // Table rows
    let publishingRowY = publishingTableY + 8;
    publishing.forEach((p) => {
      doc.rect(10, publishingRowY, 60, 8);
      doc.rect(70, publishingRowY, 70, 8);
      doc.rect(140, publishingRowY, 50, 8);
      doc.text(p.contributorName || "", 12, publishingRowY + 6);
      doc.text(p.publisher || "", 72, publishingRowY + 6);
      doc.text(p.percent || "", 142, publishingRowY + 6);
      publishingRowY += 8;
    });

    let termsY = pubStartY + 10 + publishing.length * 8 + 10;
    doc.text("Agreement Terms:", 10, termsY);

    // Add the agreement terms as plain text, with extra space after Ownership Percentages
    let agreementY = termsY + 10;
    const agreementTerms = [
      "Ownership Percentages: Each contributor listed above agrees to the ownership percentages of the composition and master recording as indicated in this Split Sheet.",
      "", // blank line for extra space
      "Royalty Distribution: All royalties and revenues earned from the exploitation of the song will be distributed according to the ownership percentages specified in this document.",
      "", // blank line for extra space
      "Rights and Licensing: Each contributor retains the right to license their share of the song unless otherwise agreed upon in a separate agreement.",
      "", // blank line for extra space
      `Dispute Resolution: Any disputes that arise concerning the ownership or distribution of royalties will be resolved through mediation or arbitration under the laws of [${form.stateCountry || "FL / USA"}].`,
      "", // blank line for extra space
      "Signatures: By signing below, all parties agree to the terms outlined in this Split Sheet and acknowledge that their contributions to the song are accurately reflected."
    ];
    agreementTerms.forEach((text, i) => {
      if (text === "") {
        agreementY += 5; // Add extra space for the blank line
      } else {
        doc.text(text, 15, agreementY, { maxWidth: 180 });
        agreementY += 10;
      }
    });

    // Draw the signatures table
    let tableY = agreementY + 5;
    doc.setFontSize(12);
    doc.text("Signatures:", 10, tableY);
    tableY += 5;

    // Table headers
    doc.setFillColor(243, 244, 246);
    doc.rect(10, tableY, 60, 8, "F");
    doc.rect(70, tableY, 60, 8, "F");
    doc.rect(130, tableY, 60, 8, "F");
    doc.setTextColor(0);
    doc.text("Name", 12, tableY + 6);
    doc.text("Signature", 72, tableY + 6);
    doc.text("Date", 132, tableY + 6);

    // Table rows
    let rowY = tableY + 8;
    contributors.forEach((c) => {
      doc.rect(10, rowY, 60, 8);
      doc.rect(70, rowY, 60, 8);
      doc.rect(130, rowY, 60, 8);
      doc.text(c.name || "", 12, rowY + 6);
      // Signature and Date cells left blank
      rowY += 8;
    });

     
    // Add Influanto branding at the bottom, centered
    const brandingY = rowY + 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add text-based branding instead of image
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Gray color
    const brandingText = "Generated by Influanto";
    const textWidth = doc.getTextWidth(brandingText);
    const brandingX = (pageWidth - textWidth) / 2; // Center the text
    
    doc.text(brandingText, brandingX, brandingY);

    doc.save(`${form.songTitle + " SplitSheet " + form.date + " influanto" || "split-sheet"}.pdf`);
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div
        id="split-sheet-bg"
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "80vh",
          width: "100%",
          textAlign: "center",
          color: "#181b20",
        }}
      >
        <div
          style={{
            padding: "2rem",
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            alignItems: "start"
          }}
          className="w-full sm:w-3/4 p-8 sm:border-r sm:border-gray-300"
        >
          <h1 className="text-3xl font-bold mb-4" style={{ color: "#181b20" }}>
            Split Sheet Template
          </h1>
          <form
            style={{ width: "100%", textAlign: "left" }}
            onSubmit={e => { e.preventDefault(); handleDownloadPDF(); }}
          >
            <label>Song Title:</label>
            <input
              name="songTitle"
              value={form.songTitle}
              onChange={handleChange}
              style={{
                width: "100%",
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                padding: "0.5rem", color:"white"
              }}
            />
            <label>Date of Creation:</label>
            <input
              name="date"
              value={form.date}
              onChange={handleChange}
              style={{
                width: "100%",
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                padding: "0.5rem", color:"white"
              }}
            />
            <label>Artist(s):</label>
            <input
              name="artists"
              value={form.artists}
              onChange={handleChange}
              style={{
                width: "100%",
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                padding: "0.5rem", color:"white"
              }}
            />

            <label>State / Country (for Dispute Resolution):</label>
            <input
              name="stateCountry"
              value={(form as any).stateCountry || ""}
              onChange={e => setForm({ ...form, stateCountry: e.target.value })}
              style={{
                width: "100%",
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                padding: "0.5rem", color:"white"
              }}
            />

            <label>Primary Contributors:</label>
            {contributors.map((c, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }} className="contributor-row">
                <input
                  placeholder="Name"
                  value={c.name}
                  onChange={e => handleContributorChange(idx, "name", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white"
                  }}
                  className="w-full sm:flex-2"
                />
                <input
                  placeholder="Role"
                  value={c.role}
                  onChange={e => handleContributorChange(idx, "role", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white"
                  }}
                  className="w-full sm:flex-1"
                />
                <input
                  placeholder="Ownership %"
                  value={c.ownership}
                  onChange={e => handleContributorChange(idx, "ownership", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white",
                  }}
                  className="w-full sm:flex-1"
                />
                <input
                  placeholder="Contact Info"
                  value={c.contact}
                  onChange={e => handleContributorChange(idx, "contact", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white"
                  }}
                  className="w-full sm:flex-2"
                />
                <button
                  type="button"
                  onClick={() => removeContributor(idx)}
                  style={{
                    color: "red",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem"
                  }}
                  className="w-full sm:w-auto"
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={addContributor}
              style={{
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                padding: "0.5rem"
              }}
            >+ Add Contributor</button>

            <h2 className="text-xl font-bold mb-4">Publishing Details:</h2>


            {publishing.map((p, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }} className="publishing-row">
                <input
                  placeholder="Contributor Name"
                  value={p.contributorName}
                  onChange={e => handlePublishingChange(idx, "contributorName", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white"
                  }}
                  className="w-full sm:flex-2"
                />
                <input
                  placeholder="Publisher"
                  value={p.publisher}
                  onChange={e => handlePublishingChange(idx, "publisher", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white"
                  }}
                  className="w-full sm:flex-2"
                />
                <input
                  placeholder="Publishing %"
                  value={p.percent}
                  onChange={e => handlePublishingChange(idx, "percent", e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem", color:"white"
                  }}
                  className="w-full sm:flex-1"
                />
                <button
                  type="button"
                  onClick={() => removePublishing(idx)}
                  style={{
                    color: "red",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0.5rem"
                  }}
                  className="w-full sm:w-auto"
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPublishing}
              style={{
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                padding: "0.5rem"
              }}
            >+ Add Publishing</button>

            <div style={{ marginBottom: 16, color: "#444", fontSize: "1rem", background: "#f3f4f6", borderRadius: 8, padding: "1rem" }}>
              <div style={{fontSize:"1.2em"}}><b>Agreement Terms:</b></div>
              <div style={{ marginTop: 8 }}>
                <b>Ownership Percentages:</b> Each contributor listed above agrees to the ownership percentages of the composition and master recording as indicated in this Split Sheet.<br />
                <b>Royalty Distribution:</b> All royalties and revenues earned from the exploitation of the song will be distributed according to the ownership percentages specified in this document.<br />
                <b>Rights and Licensing:</b> Each contributor retains the right to license their share of the song unless otherwise agreed upon in a separate agreement.<br />
                <b>Dispute Resolution:</b> Any disputes that arise concerning the ownership or distribution of royalties will be resolved through mediation or arbitration under the laws of [{(form as any).stateCountry || "State/Country"}].<br />
                <b>Signatures:</b> By signing below, all parties agree to the terms outlined in this Split Sheet and acknowledge that their contributions to the song are accurately reflected.
              </div>
            </div>

             <h2 className="text-xl font-bold mb-4">Signatures:</h2>
            <div className="w-full overflow-x-auto mb-4">
              <div className="grid grid-cols-3 gap-2 bg-white rounded-lg border border-[#cbd5e1]">
                <div className="font-semibold bg-[#f3f4f6] border-b border-[#cbd5e1] p-2 rounded-tl-lg">Name</div>
                <div className="font-semibold bg-[#f3f4f6] border-b border-[#cbd5e1] p-2">Signature</div>
                <div className="font-semibold bg-[#f3f4f6] border-b border-[#cbd5e1] p-2 rounded-tr-lg">Date</div>
                {contributors.map((c, idx) => (
                  <React.Fragment key={idx}>
                    <div className="border-t border-[#cbd5e1] p-2">{c.name}</div>
                    <div className="border-t border-[#cbd5e1] p-2">&nbsp;</div>
                    <div className="border-t border-[#cbd5e1] p-2">&nbsp;</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "0.75rem 2rem",
                fontSize: "1.1rem",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                marginTop: 16
              }}
            >
              Download PDF
            </button>
          </form>
        </div>
        <div
          style={{
            padding: "2rem",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
          className="w-full sm:w-1/4 p-8"
        >
            <h3 className="text-xl font-bold mb-4" style={{color: "#181b20"}}>Join Influanto</h3>
          <button
            className="btn btn-primary"
            style={{
              padding: "0.75rem 2rem",
              fontSize: "1.1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          onClick={() => window.location.href = "api/auth/signin?callbackUrl=/dashboard"}
          >
            Sign Up
          </button>
          <div style={{ textAlign: "center" }}>
            <p>
              Get access to more tools, save your settings, and connect with other musicians and producers.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        #split-sheet-bg {
          background: #638bcf !important;
        }
        
        @media (min-width: 640px) {
          #split-sheet-bg {
            flex-direction: row !important;
          }
          .contributor-row, .publishing-row {
            flex-direction: row !important;
          }
          .sm\\:flex-2 {
            flex: 2;
          }
          .sm\\:flex-1 {
            flex: 1;
          }
        }
      `}</style>
      <Footer />
    </>
  );
}
