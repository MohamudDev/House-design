/** Human-readable status explanations (info only — no actions). */
export const statusExplanation = {
  'Pending Payment': 'Payment is not completed yet. The project will move to Paid after a successful payment.',
  'Paid': 'Payment is confirmed. Waiting for the engineer to start work. No action is required from you right now.',
  'In Progress': 'The engineer has started work and is updating progress on this project.',
  'Revision Requested': 'The client requested changes. The engineer will continue work based on the revision notes.',
  'Completed - Waiting for Client Confirmation': 'The engineer marked the work as complete. The client should confirm completion or request revisions.',
  'Delivered': 'Completion was confirmed. This project is finished and read-only.',
  'Cancelled': 'This project was cancelled and is no longer active.'
};

/** Display labels for statuses stored in the database */
export const statusLabel = {
  'Pending Payment': 'Pending Payment',
  'Paid': 'Paid',
  'In Progress': 'In Progress',
  'Revision Requested': 'Revision Requested',
  'Completed - Waiting for Client Confirmation': 'Completed - Waiting for Client Confirmation',
  'Delivered': 'Confirmed',
  'Cancelled': 'Cancelled'
};

export const statusColor = {
  'Pending Payment': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'Paid': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'In Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Revision Requested': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Completed - Waiting for Client Confirmation': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Delivered': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
};

export default statusExplanation;
