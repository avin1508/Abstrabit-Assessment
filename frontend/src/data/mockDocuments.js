import { ago } from './mockTime.js'

/*
 * Seed documents. The mock document service copies these into an in-memory store and
 * simulates ingestion over time.
 *
 * status:  queued → processing → indexed | failed
 * stage:   extracting | chunking | embedding   (while processing)
 * failedStage: validating | extracting          (when failed)
 * expectedChunks: chunk count the simulated pipeline will produce for in-flight documents.
 */
export const MOCK_DOCUMENTS = [
  // Acme Corporation
  { id: 'doc_a12', workspaceId: 'ws_acme', name: 'Sales Playbook 2026.pdf', type: 'pdf', sizeBytes: 3_874_000, status: 'queued', chunkCount: null, expectedChunks: 236, uploadedAt: ago({ minutes: 1 }), uploadedBy: 'Marcus Lee' },
  { id: 'doc_a1', workspaceId: 'ws_acme', name: 'Q3 Board Update.pdf', type: 'pdf', sizeBytes: 5_348_000, status: 'processing', stage: 'embedding', progress: 68, chunkCount: null, expectedChunks: 174, uploadedAt: ago({ minutes: 12 }), uploadedBy: 'Demo User' },
  { id: 'doc_a2', workspaceId: 'ws_acme', name: 'Employee Handbook 2026.pdf', type: 'pdf', sizeBytes: 2_516_000, status: 'indexed', chunkCount: 412, uploadedAt: ago({ hours: 2 }), uploadedBy: 'Priya Shah' },
  { id: 'doc_a3', workspaceId: 'ws_acme', name: 'Refund Policy v4.md', type: 'md', sizeBytes: 38_900, status: 'indexed', chunkCount: 46, uploadedAt: ago({ days: 1, hours: 3 }), uploadedBy: 'Marcus Lee' },
  { id: 'doc_a4', workspaceId: 'ws_acme', name: 'Enterprise MSA.docx', type: 'docx', sizeBytes: 820_400, status: 'indexed', chunkCount: 188, uploadedAt: ago({ days: 3 }), uploadedBy: 'Demo User' },
  { id: 'doc_a5', workspaceId: 'ws_acme', name: 'Security Whitepaper.pdf', type: 'pdf', sizeBytes: 9_120_000, status: 'failed', failedStage: 'extracting', chunkCount: null, expectedChunks: 131, uploadedAt: ago({ days: 4 }), uploadedBy: 'Priya Shah', error: 'Scanned PDF — no extractable text. Upload a text-based PDF or run OCR first.' },
  { id: 'doc_a6', workspaceId: 'ws_acme', name: 'Onboarding Checklist.txt', type: 'txt', sizeBytes: 6_200, status: 'indexed', chunkCount: 12, uploadedAt: ago({ days: 6 }), uploadedBy: 'Marcus Lee' },
  { id: 'doc_a8', workspaceId: 'ws_acme', name: 'Product Roadmap H2.md', type: 'md', sizeBytes: 54_300, status: 'indexed', chunkCount: 64, uploadedAt: ago({ days: 10 }), uploadedBy: 'Demo User' },
  { id: 'doc_a9', workspaceId: 'ws_acme', name: 'Vendor Contracts Summary.docx', type: 'docx', sizeBytes: 612_000, status: 'indexed', chunkCount: 143, uploadedAt: ago({ days: 12 }), uploadedBy: 'Marcus Lee' },
  { id: 'doc_a14', workspaceId: 'ws_acme', name: 'Customer Data Processing Addendum — EU Standard Contractual Clauses (2026 revision, countersigned).pdf', type: 'pdf', sizeBytes: 684_000, status: 'indexed', chunkCount: 57, uploadedAt: ago({ days: 13 }), uploadedBy: 'Priya Shah' },
  { id: 'doc_a13', workspaceId: 'ws_acme', name: 'FY26 Revenue Plan.pdf', type: 'pdf', sizeBytes: 1_128_000, status: 'indexed', chunkCount: 94, uploadedAt: ago({ days: 16 }), uploadedBy: 'Priya Shah' },

  // Personal Workspace
  { id: 'doc_p1', workspaceId: 'ws_personal', name: 'Lisbon Travel Itinerary.txt', type: 'txt', sizeBytes: 4_100, status: 'queued', chunkCount: null, expectedChunks: 6, uploadedAt: ago({ minutes: 3 }), uploadedBy: 'Demo User' },
  { id: 'doc_p2', workspaceId: 'ws_personal', name: 'Reading Notes — DDIA.md', type: 'md', sizeBytes: 71_300, status: 'indexed', chunkCount: 96, uploadedAt: ago({ hours: 5 }), uploadedBy: 'Demo User' },
  { id: 'doc_p3', workspaceId: 'ws_personal', name: 'Tax Documents 2025.pdf', type: 'pdf', sizeBytes: 1_904_000, status: 'indexed', chunkCount: 64, uploadedAt: ago({ days: 2 }), uploadedBy: 'Demo User' },
  { id: 'doc_p4', workspaceId: 'ws_personal', name: 'Apartment Lease.pdf', type: 'pdf', sizeBytes: 1_210_000, status: 'indexed', chunkCount: 58, uploadedAt: ago({ days: 9 }), uploadedBy: 'Demo User' },
  { id: 'doc_p5', workspaceId: 'ws_personal', name: 'Car Insurance Policy.pdf', type: 'pdf', sizeBytes: 884_000, status: 'indexed', chunkCount: 44, uploadedAt: ago({ days: 20 }), uploadedBy: 'Demo User' },

  // Demo Workspace
  { id: 'doc_d1', workspaceId: 'ws_demo', name: 'Product FAQ.md', type: 'md', sizeBytes: 22_000, status: 'indexed', chunkCount: 34, uploadedAt: ago({ days: 1 }), uploadedBy: 'Abstrabit' },
  { id: 'doc_d2', workspaceId: 'ws_demo', name: 'Pricing Sheet.csv', type: 'csv', sizeBytes: 14_800, status: 'failed', failedStage: 'validating', chunkCount: null, uploadedAt: ago({ days: 1, hours: 4 }), uploadedBy: 'Abstrabit', error: 'Unsupported file type (.csv). Upload PDF, DOCX, Markdown or plain text.' },
  { id: 'doc_d3', workspaceId: 'ws_demo', name: 'Getting Started Guide.pdf', type: 'pdf', sizeBytes: 3_050_000, status: 'indexed', chunkCount: 120, uploadedAt: ago({ days: 2 }), uploadedBy: 'Abstrabit' },

  // Research Lab — intentionally empty (exercises empty states).
]
