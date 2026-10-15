/* Optional local-fixture diagnostics. Never included in the published tool. */
if (new URLSearchParams(location.search).has('worker-trace') && typeof Worker === 'function') {
 const NativeWorker=Worker;
 window.__rwWorkerTrace={jobs:[],messages:[],terminations:[]};
 window.Worker=class extends NativeWorker {
  constructor(...args){super(...args);this.addEventListener('message',event=>{const d=event.data;__rwWorkerTrace.messages.push({id:d?.id,type:d?.type,at:performance.now(),...(d?.type==='result'?{warnings:d.result?.warnings||[],changed:d.result?.text!==window.__rwLastWorkerJob?.source}:{})});});}
  postMessage(message,...args){if(message?.type==='calculate'){window.__rwLastWorkerJob=message.job;__rwWorkerTrace.jobs.push({id:message.id,at:performance.now(),kind:message.job.kind,sourceBytes:new TextEncoder().encode(message.job.source).length});}return super.postMessage(message,...args);}
  terminate(){__rwWorkerTrace.terminations.push({at:performance.now()});return super.terminate();}
 };
}
