"use client";
import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import jsPDF from "jspdf";

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

  const [contributors, setContributors] = useState([{
    name: "",
    role: "",
    ownership: "",
    contact: "",
    signature: "",
    signatureDate: ""
  }]);
  const [publishing, setPublishing] = useState([
    { contributorName: "", publisher: "", percent: "" }
  ]);
  const [signatureEditor, setSignatureEditor] = useState<{ active: boolean; index: number | null }>({ active: false, index: null });
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    document.title = "Split Sheet Generator | Influanto";
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Split Sheet Generator - Create professional split sheets for your music collaborations powered by Influanto.');
    
    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Split Sheet Generator | Influanto');
    
    // Update og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Fill out and save your Split Sheets easily. Free musician tools by Influanto.');
    
    // Update twitter:title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', 'Split Sheet Generator | Influanto');
    
    // Update twitter:description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', 'Generate and share your Split Sheets easily. Free musician tools by Influanto.');
  }, []);

  const addContributor = () => setContributors([...contributors, { name: "", role: "", ownership: "", contact: "", signature: "", signatureDate: "" }]);
  const removeContributor = (idx: number) => setContributors(contributors.filter((_, i) => i !== idx));

  const addPublishing = () => setPublishing([...publishing, { contributorName: "", publisher: "", percent: "" }]);
  const removePublishing = (idx: number) => setPublishing(publishing.filter((_, i) => i !== idx));

  const openSignatureEditor = (idx: number) => {
    setSignatureEditor({ active: true, index: idx });
  };

  const closeSignatureEditor = () => {
    setSignatureEditor({ active: false, index: null });
    setIsDrawing(false);
    lastPointerPosition.current = null;
  };

  const prepareEditorCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (signatureEditor.active && signatureEditor.index !== null) {
      const existingSignature = contributors[signatureEditor.index].signature;
      if (existingSignature) {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        };
        image.src = existingSignature;
      }
    }
  };

  useEffect(() => {
    if (signatureEditor.active) {
      prepareEditorCanvas();
    }
  }, [signatureEditor.active, signatureEditor.index]);

  const pointerToCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleSignaturePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const position = pointerToCanvas(event);
    if (!position) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    lastPointerPosition.current = position;
    setIsDrawing(true);
    canvas?.setPointerCapture(event.pointerId);
  };

  const handleSignaturePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const position = pointerToCanvas(event);
    if (!position) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPointerPosition.current) return;
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
    lastPointerPosition.current = position;
  };

  const handleSignaturePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
    lastPointerPosition.current = null;
    canvas?.releasePointerCapture(event.pointerId);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (signatureEditor.index === null) {
      return;
    }
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL("image/png");
    const currentDate = new Date().toLocaleDateString("en-US");

    setContributors(prev => {
      const next = [...prev];
      next[signatureEditor.index!] = {
        ...next[signatureEditor.index!],
        signature: signatureData,
        signatureDate: currentDate,
      };
      return next;
    });

    closeSignatureEditor();
  };

const handleDownloadPDF = () => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 0;

  // Add Influanto branding at the top right
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const brandingText = "influanto";
  const pageWidthTop = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(brandingText);
  const brandingX = pageWidthTop - textWidth - 10;
  doc.text(brandingText, brandingX, 10);
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("SPLIT SHEET AGREEMENT", 10, 15);
  doc.setFontSize(12);
  doc.text(`Song Title: ${form.songTitle}`, 10, 30);
  doc.text(`Date of Creation: ${form.date}`, 10, 40);
  doc.text(`Artist(s): ${form.artists}`, 10, 50);

  // Primary Contributors Table
  doc.text("Primary Contributors:", 10, 60);
  currentY = 65;

  // Table headers
  doc.setFillColor(243, 244, 246);
  doc.rect(10, currentY, 40, 8, "F");
  doc.rect(50, currentY, 50, 8, "F");
  doc.rect(100, currentY, 15, 8, "F");
  doc.rect(115, currentY, 75, 8, "F");
  doc.setTextColor(0);
  doc.text("Name", 12, currentY + 6);
  doc.text("Role", 52, currentY + 6);
  doc.text("Own %", 102, currentY + 6);
  doc.text("Contact", 117, currentY + 6);

  currentY += 8;

  // Table rows with page break logic
  contributors.forEach((c, index) => {
    const nameLines = Math.ceil((c.name || "").length / 18) || 1;
    const roleLines = Math.ceil((c.role || "").length / 25) || 1;
    const contactLines = Math.ceil((c.contact || "").length / 32) || 1;
    const rowHeight = Math.max(nameLines, roleLines, contactLines) * 8;
    
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20; // Start from top of new page
      
      // Re-add table headers on new page
      doc.setFillColor(243, 244, 246);
      doc.rect(10, currentY, 40, 8, "F");
      doc.rect(50, currentY, 50, 8, "F");
      doc.rect(100, currentY, 15, 8, "F");
      doc.rect(115, currentY, 75, 8, "F");
      doc.setTextColor(0);
      doc.text("Name", 12, currentY + 6);
      doc.text("Role", 52, currentY + 6);
      doc.text("Own %", 102, currentY + 6);
      doc.text("Contact", 117, currentY + 6);
      currentY += 8;
    }
    
    doc.rect(10, currentY, 40, rowHeight);
    doc.rect(50, currentY, 50, rowHeight);
    doc.rect(100, currentY, 15, rowHeight);
    doc.rect(115, currentY, 75, rowHeight);

    doc.text(c.name || "", 12, currentY + 6, { maxWidth: 38 });
    doc.text(c.role || "", 52, currentY + 6, { maxWidth: 48 });
    doc.text(c.ownership || "", 102, currentY + 6, { maxWidth: 13 });
    doc.text(c.contact || "", 117, currentY + 6, { maxWidth: 73 });
    
    currentY += rowHeight;
  });

  // Publishing Details Table
  currentY += 10;
  
  // Check if we need a new page for publishing section
  if (currentY + 50 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.text("Publishing Details:", 10, currentY);
  currentY += 5;

  // Publishing table headers
  doc.setFillColor(243, 244, 246);
  doc.rect(10, currentY, 60, 8, "F");
  doc.rect(70, currentY, 70, 8, "F");
  doc.rect(140, currentY, 50, 8, "F");
  doc.setTextColor(0);
  doc.text("Contributor Name", 12, currentY + 6);
  doc.text("Publisher", 72, currentY + 6);
  doc.text("Publishing %", 142, currentY + 6);
  currentY += 8;

  // Publishing rows with page break logic
  publishing.forEach((p) => {
    const contributorNameLines = Math.ceil((p.contributorName || "").length / 25) || 1;
    const publisherLines = Math.ceil((p.publisher || "").length / 30) || 1;
    const percentLines = Math.ceil((p.percent || "").length / 20) || 1;
    const rowHeight = Math.max(contributorNameLines, publisherLines, percentLines) * 8;
    
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 10) {
      doc.addPage();
      currentY = 20;
      
      // Re-add publishing headers on new page
      doc.setFillColor(243, 244, 246);
      doc.rect(10, currentY, 60, 8, "F");
      doc.rect(70, currentY, 70, 8, "F");
      doc.rect(140, currentY, 50, 8, "F");
      doc.setTextColor(0);
      doc.text("Contributor Name", 12, currentY + 6);
      doc.text("Publisher", 72, currentY + 6);
      doc.text("Publishing %", 142, currentY + 6);
      currentY += 8;
    }
    
    doc.rect(10, currentY, 60, rowHeight);
    doc.rect(70, currentY, 70, rowHeight);
    doc.rect(140, currentY, 50, rowHeight);

    doc.text(p.contributorName || "", 12, currentY + 6, { maxWidth: 58 });
    doc.text(p.publisher || "", 72, currentY + 6, { maxWidth: 68 });
    doc.text(p.percent || "", 142, currentY + 6, { maxWidth: 48 });
    
    currentY += rowHeight;
  });

  // Agreement Terms
  currentY += 10;
  
  // Check if we need a new page for agreement terms
  if (currentY + 100 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.text("Agreement Terms:", 10, currentY);
  currentY += 10;

  const agreementTerms = [
    "Ownership Percentages: Each contributor listed above agrees to the ownership percentages of the composition and master recording as indicated in this Split Sheet.",
    "Royalty Distribution: All royalties and revenues earned from the exploitation of the song will be distributed according to the ownership percentages specified in this document.",
    "Rights and Licensing: Each contributor retains the right to license their share of the song unless otherwise agreed upon in a separate agreement.",
    `Dispute Resolution: Any disputes that arise concerning the ownership or distribution of royalties will be resolved through mediation or arbitration under the laws of [${form.stateCountry || "FL / USA"}].`,
    "Signatures: By signing below, all parties agree to the terms outlined in this Split Sheet and acknowledge that their contributions to the song are accurately reflected."
  ];

  agreementTerms.forEach((text) => {
    if (text === "") {
      currentY += 5;
    } else {
      // Check if we need a new page
      if (currentY + 20 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(text, 15, currentY, { maxWidth: 180 });
      currentY += 15;
    }
  });

 // ...existing code...

  // Signatures table
  currentY += 5;
  
  // Check if we need a new page for signatures - calculate actual space needed
  const signatureHeaderHeight = 8;
  const totalSignatureRows = contributors.length;
  const averageRowHeight = 15; // Average height per signature row
  const totalSignatureSpace = signatureHeaderHeight + (totalSignatureRows * averageRowHeight) + 10; // Add 10 for padding
  
  if (currentY + totalSignatureSpace > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(12);
  doc.text("Signatures:", 10, currentY);
  currentY += 5;

  // Signature table headers
  doc.setFillColor(243, 244, 246);
  doc.rect(10, currentY, 60, 8, "F");
  doc.rect(70, currentY, 60, 8, "F");
  doc.rect(130, currentY, 60, 8, "F");
  doc.setTextColor(0);
  doc.text("Name", 12, currentY + 6);
  doc.text("Signature", 72, currentY + 6);
  doc.text("Date", 132, currentY + 6);
  currentY += 8;

  // Signature rows
  contributors.forEach((c) => {
    const nameLines = Math.ceil((c.name || "").length / 25) || 1;
    const rowHeight = Math.max(nameLines * 8, 20);
    
    // Check if we need a new page for individual rows
    if (currentY + rowHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      
      // Re-add signature headers on new page
      doc.setFillColor(243, 244, 246);
      doc.rect(10, currentY, 60, 8, "F");
      doc.rect(70, currentY, 60, 8, "F");
      doc.rect(130, currentY, 60, 8, "F");
      doc.setTextColor(0);
      doc.text("Name", 12, currentY + 6);
      doc.text("Signature", 72, currentY + 6);
      doc.text("Date", 132, currentY + 6);
      currentY += 8;
    }
    
    doc.rect(10, currentY, 60, rowHeight);
    doc.rect(70, currentY, 60, rowHeight);
    doc.rect(130, currentY, 60, rowHeight);
    
    doc.text(c.name || "", 12, currentY + 6, { maxWidth: 58 });
    if (c.signature) {
      try {
        doc.addImage(c.signature, "PNG", 72, currentY + 2, 56, rowHeight - 4);
      } catch (error) {
        // ignore invalid image data
      }
    }
    doc.text(c.signatureDate || "", 132, currentY + 6, { maxWidth: 58 });
    currentY += rowHeight;
  });

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
            Split Sheet Generator
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
                    <div className="border-t border-[#cbd5e1] p-2">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1, overflow: "hidden", minHeight: 28 }}>
                          {c.signature ? (
                            <img src={c.signature} alt="signature" style={{ maxHeight: 38, width: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ color: "#6b7280" }}>No signature yet</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openSignatureEditor(idx)}
                          style={{
                            marginLeft: 8,
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            padding: "0.35rem 0.75rem",
                            background: "#fff",
                            color: "#111",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-[#cbd5e1] p-2">{c.signatureDate || ""}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {signatureEditor.active && signatureEditor.index !== null && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{ width: "100%", maxWidth: 720, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)", overflow: "hidden" }}>
                  <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb" }}>
                    <h3 className="text-xl font-semibold">Draw Signature</h3>
                    <p className="text-sm text-[#6b7280] mt-1">Use your mouse or touch device to sign below. Save to record the date.</p>
                  </div>
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                      <canvas
                        ref={signatureCanvasRef}
                        width={680}
                        height={220}
                        onPointerDown={handleSignaturePointerDown}
                        onPointerMove={handleSignaturePointerMove}
                        onPointerUp={handleSignaturePointerUp}
                        onPointerLeave={handleSignaturePointerUp}
                        style={{ width: "100%", height: 220, touchAction: "none", background: "#fff", display: "block" }}
                      />
                    </div>
                  </div>
                  <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={clearSignatureCanvas}
                      style={{ borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#111", padding: "0.6rem 1rem", cursor: "pointer" }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={closeSignatureEditor}
                      style={{ borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#111", padding: "0.6rem 1rem", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveSignature}
                      style={{ borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", padding: "0.6rem 1rem", cursor: "pointer" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

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
               Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.
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
