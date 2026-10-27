export async function authenticateWithResources({ authenticate, isCurrent, onAuthenticated, onSettled, loadResources, onResourceError = () => {}, onResourceJob = () => {}, timeoutMs = 15000 }) {
  try {
    const account = await authenticate();
    if (!isCurrent()) return;
    onAuthenticated(account);
    const controller = new AbortController();
    const report = error => { if (isCurrent() && error.status !== 401) onResourceError(error); };
    const timer = setTimeout(() => {
      controller.abort();
      report(new Error('Resource loading timed out. Please retry.'));
    }, timeoutMs);
    onResourceJob(() => { clearTimeout(timer); controller.abort(); });
    Promise.resolve().then(() => {
      if (!controller.signal.aborted && isCurrent()) return loadResources(account, { signal: controller.signal });
    }).catch(error => {
      if (!controller.signal.aborted) report(error);
    }).finally(() => clearTimeout(timer));
  } finally {
    if (isCurrent()) onSettled();
  }
}

export async function runTicketMutation({ action, signal, selectionVersion, onTicket, onSelect }) {
  const version = selectionVersion();
  const result = await action({ signal });
  if (signal.aborted) return false;
  if (result?.id && result?.subject) {
    onTicket(result);
    if (selectionVersion() === version) onSelect(result.id);
  }
  return true;
}
