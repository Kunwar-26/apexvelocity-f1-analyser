import React from 'react';
import { X, ExternalLink, Download, GitBranch } from 'lucide-react';

interface GitHubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl: string;
}

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({ isOpen, onClose, repoUrl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <section role="dialog" aria-modal="true" aria-labelledby="repository-title" className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 id="repository-title" className="text-lg text-white flex items-center gap-2"><GitBranch className="w-5 h-5" />Project source</h2>
          <button aria-label="Close dialog" onClick={onClose} className="quiet-button"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-400 mb-6">Browse the code, read setup instructions, or download the project from GitHub.</p>
        <div className="flex flex-wrap gap-3">
          <a href={repoUrl} target="_blank" rel="noreferrer" className="primary-button"><ExternalLink className="w-4 h-4" />View repository</a>
          <a href={`${repoUrl}/archive/refs/heads/main.zip`} className="quiet-button"><Download className="w-4 h-4" />Download source</a>
        </div>
      </section>
    </div>
  );
};
