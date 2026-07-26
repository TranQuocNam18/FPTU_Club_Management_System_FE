import type { BudgetProposal } from '../../api/finance.api';

export function financeStatus(status: BudgetProposal['status']) {
  return status === 'PendingApproval' ? 'Pending' : status;
}
