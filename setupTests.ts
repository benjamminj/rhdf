const mutationObserver = require('@sheerun/mutationobserver-shim')

if (typeof window !== 'undefined') {
  window.MutationObserver = mutationObserver
}
