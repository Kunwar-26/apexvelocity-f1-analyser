import React, { useState } from 'react';
import { Download, GitBranch, Menu, X } from 'lucide-react';
type View = '3d' | 'map' | 'telemetry' | 'braking' | 'comparison' | 'code';
interface HeaderProps { activeTab: View; onSelectTab: (tab: View) => void; onOpenExportModal: () => void; onOpenGitModal: () => void; }
const views: { id: View; label: string }[] = [
  { id: '3d', label: '3D simulation' }, { id: 'map', label: 'Speed map' },
  { id: 'telemetry', label: 'Telemetry' }, { id: 'braking', label: 'Braking zones' },
  { id: 'comparison', label: 'Driver delta' }, { id: 'code', label: 'Python lab' },
];
export function Header({ activeTab, onSelectTab, onOpenExportModal, onOpenGitModal }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="app-header">
    <div className="header-top">
      <div className="wordmark"><span className="apex-mark" aria-hidden="true" />ApexVelocity<span className="brand-caption">Lap analysis</span></div>
      <div className="header-actions">
        <button className="quiet-button" onClick={onOpenGitModal} aria-label="Project on GitHub"><GitBranch /><span className="action-label">GitHub</span></button>
        <button className="primary-button" onClick={onOpenExportModal}><Download /><span>Export</span></button>
        <button className="menu-button quiet-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="workspace-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </div>
    <nav id="workspace-navigation" aria-label="Analysis views" className={`workspace-nav ${menuOpen ? 'is-open' : ''}`}>
      {views.map(view => <button key={view.id} aria-current={activeTab === view.id ? 'page' : undefined} onClick={() => { onSelectTab(view.id); setMenuOpen(false); }}><span className="sector-mark" aria-hidden="true" />{view.label}</button>)}
      <span className="workspace-caption">Circuit workspace</span>
    </nav>
  </header>;
}
