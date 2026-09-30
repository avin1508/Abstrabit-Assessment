/*
 * Canned "knowledge" for the mock assistant. Each entry belongs to one workspace and cites
 * documents that exist in that workspace (see mockDocuments.js). The mock chat service matches
 * questions against these; anything unmatched gets an honest "I don't know".
 *
 * Answer text supports **bold**, `code`, "- " bullet lines and [n] citation markers.
 */

const cite = (index, documentId, documentName, type, location, excerpt) => ({
  index,
  documentId,
  documentName,
  type,
  location,
  excerpt,
})

// ---------------------------------------------------------------- Acme Corporation

export const ACME_REFUND = {
  text:
    'Customers can request a refund within **30 days** of the original purchase, provided the request meets the eligibility conditions in the refund policy [1]. Requests go through the billing portal with the original order number, and approved refunds are returned to the original payment method within 5–7 business days [2].\n\nPurchases older than 30 days aren’t eligible for a cash refund, but may qualify for account credit at a manager’s discretion [1].',
  citations: [
    cite(1, 'doc_a3', 'Refund Policy v4.md', 'md', 'Section: Refund Eligibility', 'Customers may request a refund within 30 days of the original purchase date, provided the product has not been substantially used and the request includes the original order number.'),
    cite(2, 'doc_a2', 'Employee Handbook 2026.pdf', 'pdf', 'Page 42', 'Refund requests must be submitted through the billing portal. Finance processes approved refunds to the original payment method within 5–7 business days.'),
  ],
}

export const ACME_REFUND_ENTERPRISE = {
  text:
    'Enterprise contracts use a different window. Under the Enterprise MSA, customers can request a full refund within **60 days** of the invoice date; after that, unused prepaid fees become prorated service credits instead of refunds [1].\n\nThe standard 30-day policy applies only to self-serve plans [2].',
  citations: [
    cite(1, 'doc_a4', 'Enterprise MSA.docx', 'docx', 'Section 8.2 · Refunds', 'Customer may request a full refund of prepaid Fees within sixty (60) days of the invoice date. Thereafter, unused prepaid Fees shall be converted to service credits on a prorated basis.'),
    cite(2, 'doc_a3', 'Refund Policy v4.md', 'md', 'Section: Scope', 'This policy applies to self-serve subscriptions purchased online. Enterprise agreements are governed by their Master Services Agreement.'),
  ],
}

export const ACME_REVENUE = {
  text:
    'The FY26 Revenue Plan sets a Q3 target of **$4.8M** in total revenue: $3.9M recurring and $0.9M professional services [1]. It flags a projected **6% shortfall** in services revenue, driven by slower enterprise onboarding [1][2].',
  citations: [
    cite(1, 'doc_a13', 'FY26 Revenue Plan.pdf', 'pdf', 'Page 7 · Q3 Targets', 'Q3 total revenue target: $4.8M (recurring $3.9M; services $0.9M). Services forecast currently tracking 6% below plan due to delayed enterprise go-lives.'),
    cite(2, 'doc_a8', 'Product Roadmap H2.md', 'md', 'Section: Enterprise Onboarding', 'Enterprise onboarding timelines slipped by ~3 weeks in Q2; the onboarding revamp is a dependency for SSO & SCIM.'),
  ],
}

export const ACME_PTO = {
  text:
    'Full-time employees accrue **1.67 days of paid time off per month** (20 days a year), and up to 5 unused days carry over into the next year [1]. Requests longer than 3 consecutive days need manager approval at least two weeks in advance [1].',
  citations: [
    cite(1, 'doc_a2', 'Employee Handbook 2026.pdf', 'pdf', 'Page 18 · Paid Time Off', 'Full-time employees accrue 1.67 days of PTO per month worked. A maximum of five (5) unused days may be carried over. Absences exceeding three consecutive days require manager approval two weeks in advance.'),
  ],
}

export const ACME_PASSWORDS = {
  text:
    'Employee passwords must be at least **14 characters**, can’t reuse any of the last 10 passwords, and must be stored in the company password manager [1]. Multi-factor authentication is mandatory for email, SSO and production systems [1][2].',
  citations: [
    cite(1, 'doc_a2', 'Employee Handbook 2026.pdf', 'pdf', 'Page 57 · IT & Security', 'Passwords must be a minimum of 14 characters, may not match any of the previous 10 passwords, and must be stored in the approved password manager. MFA is required for email, SSO and all production access.'),
    cite(2, 'doc_a6', 'Onboarding Checklist.txt', 'txt', 'Lines 14–19', 'Day 1 — Security: enable MFA on Google Workspace and Okta; install the password manager; complete security awareness training.'),
  ],
}

export const ACME_SECURITY_CHECKLIST = {
  text:
    'Here’s a security onboarding checklist based on the handbook and onboarding guide:\n- Create a 14+ character password and store it in the password manager [1]\n- Enable MFA on email, SSO and any production access [1][2]\n- Install the password manager on day 1 [2]\n- Complete security awareness training in the first week [2]',
  citations: ACME_PASSWORDS.citations,
}

export const ACME_ROADMAP = {
  text:
    'The H2 roadmap has three themes [1]:\n- **Workspace analytics** — usage dashboards for admins, targeted for Q3\n- **SSO & SCIM** — enterprise identity provisioning, targeted for Q3\n- **Mobile app beta** — read-only access to documents and chat, targeted for Q4\n\nThe enterprise onboarding revamp is listed as a dependency for the SSO work [1].',
  citations: [
    cite(1, 'doc_a8', 'Product Roadmap H2.md', 'md', 'Section: H2 Themes', 'H2 themes: (1) Workspace analytics — Q3; (2) SSO & SCIM — Q3, depends on onboarding revamp; (3) Mobile app beta (read-only) — Q4.'),
  ],
}

export const ACME_VENDOR = {
  text:
    'The Northwind Logistics agreement auto-renews on **November 30, 2026** unless notice is given 60 days in advance — by **October 1** [1]. Its renewal terms follow the Term & Renewal clause of the Enterprise MSA template [2].',
  citations: [
    cite(1, 'doc_a9', 'Vendor Contracts Summary.docx', 'docx', 'Page 4 · Northwind Logistics', 'Northwind Logistics — auto-renewal 30 Nov 2026; 60-day written notice required to terminate; pricing uplift capped at 5%.'),
    cite(2, 'doc_a4', 'Enterprise MSA.docx', 'docx', 'Section 12 · Term & Renewal', 'This Agreement renews automatically for successive twelve-month terms unless either party provides written notice at least sixty (60) days prior to the end of the then-current term.'),
  ],
}

// ---------------------------------------------------------------- Personal Workspace

export const PERSONAL_LEASE = {
  text:
    'You need to give **60 days’ written notice** before the end of the lease term; without it, the lease continues month-to-month [1]. Notice must be delivered by email and certified mail [1].',
  citations: [
    cite(1, 'doc_p4', 'Apartment Lease.pdf', 'pdf', 'Page 3 · Section 5: Termination', 'Tenant shall provide no less than sixty (60) days’ written notice prior to the expiration of the Term, delivered by email and certified mail. Absent notice, tenancy converts to month-to-month.'),
  ],
}

export const PERSONAL_RECEIPTS = {
  text:
    'Your home office worksheet lists utilities, internet and rent receipts. The internet receipts for **October–December** are marked as missing [1].',
  citations: [
    cite(1, 'doc_p3', 'Tax Documents 2025.pdf', 'pdf', 'Page 6 · Home Office Worksheet', 'Supporting documents: utilities (12/12 ✓), rent (12/12 ✓), internet (9/12 — Oct, Nov, Dec missing).'),
  ],
}

// ---------------------------------------------------------------- Demo Workspace

export const DEMO_FREE_PLAN = {
  text: 'The free plan includes up to **3 workspaces**, **100 documents** and **50 AI questions per day** [1]. Tool calls such as tasks and summaries require a paid plan [1].',
  citations: [
    cite(1, 'doc_d1', 'Product FAQ.md', 'md', 'Section: Plans', 'Free: 3 workspaces, 100 documents, 50 AI questions/day. Team: unlimited workspaces, tool integrations (tasks, Slack/Discord summaries), SSO.'),
  ],
}

// ---------------------------------------------------------------- matching

/*
 * Ordered; first match wins. `exclude` lets a narrower question fall through to "I don't know"
 * (e.g. parental leave in Germany is not covered by the PTO section).
 */
export const KNOWLEDGE = [
  { workspaceId: 'ws_acme', match: /enterprise|msa/i, requires: /refund/i, answer: ACME_REFUND_ENTERPRISE },
  { workspaceId: 'ws_acme', match: /refund/i, answer: ACME_REFUND },
  { workspaceId: 'ws_acme', match: /revenue|q3|target|forecast/i, answer: ACME_REVENUE },
  { workspaceId: 'ws_acme', match: /pto|time off|vacation|leave/i, exclude: /parental|maternity|paternity|germany/i, answer: ACME_PTO },
  { workspaceId: 'ws_acme', match: /checklist/i, answer: ACME_SECURITY_CHECKLIST },
  { workspaceId: 'ws_acme', match: /password|mfa|security/i, answer: ACME_PASSWORDS },
  { workspaceId: 'ws_acme', match: /roadmap|h2|planned/i, answer: ACME_ROADMAP },
  { workspaceId: 'ws_acme', match: /vendor|northwind|renew/i, answer: ACME_VENDOR },
  { workspaceId: 'ws_personal', match: /lease|notice|move out/i, answer: PERSONAL_LEASE },
  { workspaceId: 'ws_personal', match: /receipt|home office/i, answer: PERSONAL_RECEIPTS },
  { workspaceId: 'ws_demo', match: /plan|pricing|include|free/i, answer: DEMO_FREE_PLAN },
]

