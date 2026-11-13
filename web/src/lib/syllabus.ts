// Chapters per subject. Sample list for now; Phase 2 (Learning) replaces it with the
// courses → subjects → chapters the academy creates.
export const CHAPTERS: Record<string, string[]> = {
  Accounting: ['AS 1 – Disclosure of Accounting Policies', 'AS 2 – Inventories', 'AS 10 – Property, Plant & Equipment', 'AS 11 – Foreign Exchange', 'Partnership', 'Company Accounts', 'Cash Flow Statements', 'Amalgamation'],
  Taxation: ['Basic Concepts', 'Residential Status', 'Salaries', 'House Property', 'PGBP', 'Capital Gains', 'Other Sources', 'GST – Supply', 'GST – Input Tax Credit'],
  'Auditing & Ethics': ['Nature of Audit', 'Standards on Auditing', 'Audit Planning', 'Internal Control', 'Audit Evidence', 'Audit Report', 'Professional Ethics'],
  'Corporate & Other Laws': ['Share Capital & Debentures', 'Board Meetings', 'Accounts of Companies', 'General Clauses Act', 'Interpretation of Statutes'],
  'Cost & Management Accounting': ['Material Cost', 'Labour Cost', 'Overheads', 'Marginal Costing', 'Standard Costing', 'Budgetary Control', 'Process Costing'],
  'Financial Management': ['Ratio Analysis', 'Cost of Capital', 'Capital Structure', 'Leverages', 'Capital Budgeting', 'Working Capital'],
  'Financial Reporting': ['Ind AS 1', 'Ind AS 16', 'Ind AS 115', 'Ind AS 109', 'Consolidation'],
  'Direct Tax Laws': ['Assessment Procedure', 'International Taxation', 'Transfer Pricing', 'TDS & TCS'],
  'Indirect Tax Laws': ['Supply under GST', 'Place of Supply', 'Input Tax Credit', 'Customs Valuation', 'E-way Bill', 'Returns & Payment'],
};
