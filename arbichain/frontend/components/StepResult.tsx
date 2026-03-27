'use client';

interface StepResultData {
  txHash?: string;
  explorerUrl?: string;
  specCid?: string;
  deliverableCid?: string;
  reportCid?: string;
  specRetrievalUrl?: string;
  deliverableRetrievalUrl?: string;
  reportRetrievalUrl?: string;
  amount?: string;
  contentPreview?: string;
  wordCount?: number;
  ruling?: string;
  reason?: string;
  action?: string;
  analysis?: any;
}

function CidLink({ label, cid, url }: { label: string; cid: string; url?: string | null }) {
  const truncated = cid.length > 30 ? cid.slice(0, 14) + '...' + cid.slice(-14) : cid;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-[#71717a] w-28 shrink-0">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono text-purple-400 hover:text-purple-300 truncate">
          {truncated}
        </a>
      ) : (
        <span className="font-mono text-[#a1a1aa] truncate">{truncated}</span>
      )}
    </div>
  );
}

export default function StepResult({ data }: { data: StepResultData }) {
  return (
    <div className="bg-[#12121a] rounded-lg p-3 space-y-2 animate-slide-in border border-[#2a2a40]">
      {data.txHash && (
        <div className="flex items-start gap-2 text-xs">
          <span className="text-[#71717a] w-28 shrink-0">TRON TX</span>
          <a
            href={data.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-400 hover:text-blue-300 truncate"
          >
            {data.txHash.slice(0, 16)}...{data.txHash.slice(-16)}
          </a>
        </div>
      )}
      {data.specCid && <CidLink label="Task Spec CID" cid={data.specCid} url={data.specRetrievalUrl} />}
      {data.deliverableCid && <CidLink label="Deliverable CID" cid={data.deliverableCid} url={data.deliverableRetrievalUrl} />}
      {data.reportCid && <CidLink label="Report CID" cid={data.reportCid} url={data.reportRetrievalUrl} />}
      {data.amount && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#71717a] w-28 shrink-0">Escrowed</span>
          <span className="font-semibold text-amber-400">{data.amount}</span>
        </div>
      )}
      {data.contentPreview && (
        <div className="text-xs">
          <span className="text-[#71717a]">Content: </span>
          <span className="text-[#a1a1aa] italic">"{data.contentPreview}"</span>
          {data.wordCount !== undefined && (
            <span className="ml-1 text-[#71717a]">({data.wordCount} words)</span>
          )}
        </div>
      )}
      {data.analysis && (
        <div className="grid grid-cols-2 gap-1 text-xs pt-1 border-t border-[#2a2a40]">
          <span>Words: <b className="text-red-400">{data.analysis.wordCount}</b> / {data.analysis.requiredWords}</span>
          <span>Citations: <b className={data.analysis.hasCitations ? 'text-emerald-400' : 'text-red-400'}>{data.analysis.hasCitations ? 'YES' : 'NO'}</b></span>
          <span>ZK-SNARKs: <b className={data.analysis.coversZkSnarks ? 'text-emerald-400' : 'text-red-400'}>{data.analysis.coversZkSnarks ? 'YES' : 'NO'}</b></span>
          <span>ZK-STARKs: <b className={data.analysis.coversZkStarks ? 'text-emerald-400' : 'text-red-400'}>{data.analysis.coversZkStarks ? 'YES' : 'NO'}</b></span>
        </div>
      )}
      {data.ruling && (
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-[#2a2a40]">
          <span className="text-[#71717a]">Ruling:</span>
          <span className={`font-semibold ${data.ruling === 'REFUND_BUYER' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {data.ruling}
          </span>
        </div>
      )}
      {data.reason && (
        <div className="text-xs text-red-400">{data.reason}</div>
      )}
      {data.action && (
        <div className="text-xs text-emerald-400 font-medium">{data.action}</div>
      )}
    </div>
  );
}
