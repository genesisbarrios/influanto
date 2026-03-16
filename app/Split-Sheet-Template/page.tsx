"use client";
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SplitSheetTemplate() {
  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Split Sheet Template</h1>
          <div className="bg-base-200 p-8 rounded-lg shadow-lg">
            <p className="text-lg text-center text-base-content/70 mb-6">
              A sample split sheet template for music collaborations.
            </p>

            {/* Sample Split Sheet Content */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Song Information</h3>
                  <div className="space-y-2">
                    <p><strong>Song Title:</strong> [Song Title]</p>
                    <p><strong>Artists:</strong> [Artist Names]</p>
                    <p><strong>Date:</strong> [Date]</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Contributors</h3>
                  <div className="space-y-2">
                    <p><strong>Contributor 1:</strong> [Name] - [Role] - [Ownership %]</p>
                    <p><strong>Contributor 2:</strong> [Name] - [Role] - [Ownership %]</p>
                    <p><strong>Contributor 3:</strong> [Name] - [Role] - [Ownership %]</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Publishing Information</h3>
                <div className="space-y-2">
                  <p><strong>Publisher:</strong> [Publisher Name]</p>
                  <p><strong>PRO:</strong> [Performing Rights Organization]</p>
                  <p><strong>IPI/CAE:</strong> [IPI/CAE Number]</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Royalty Split</h3>
                <div className="bg-base-100 p-4 rounded">
                  <p className="text-center">[Royalty split details would go here]</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-base-content/60">
                  Use our <a href="/Split-Sheet-Generator" className="link link-primary">Split Sheet Generator</a> to create your own customized split sheet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}