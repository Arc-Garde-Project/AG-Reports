/* =========================================================== */
/* AG Error Handler v1.1 — Phase B (CANONICAL DROP-IN)         */
/* Load FIRST, before every other script, or the errors it exists to catch     */
/* happen before it is listening.                                             */
/* LOCAL ONLY: writes to window.AG_ERROR_LOG and makes ZERO network requests,  */
/* so it needs no connect-src widening and no backend of any kind.            */
/* v1.1 2026-08-21: promoted out of the Codex sandbox and parameterized by     */
/* data-project, so it is no longer hardcoded to one build.                   */
/* =========================================================== */
(function () {
  var tag = document.currentScript || document.querySelector('script[data-project]');
  window.AG_PROJECT = (tag && tag.getAttribute('data-project')) || window.AG_PROJECT || 'unnamed';
  window.AG_ERROR_LOG = [];

  function record(type, detail) {
    window.AG_ERROR_LOG.push({
      project: window.AG_PROJECT,
      type: type,
      detail: String(detail && (detail.message || detail.reason || detail)).slice(0, 500),
      at: new Date().toISOString()
    });
  }

  window.addEventListener('error', function (event) { record('error', event.error || event.message); });
  window.addEventListener('unhandledrejection', function (event) { record('promise', event.reason); });
  window.addEventListener('error', function (event) {
    if (event.target && event.target !== window) record('resource', (event.target.tagName || 'resource') + ' failed');
  }, true);
})();
