import React from 'react';
import { Info, Code, FileText, Database, Server, Brain, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

const TechItem = ({ icon, name, desc }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--white)' }}>
    <div style={{ color: 'var(--primary)', padding: '0.5rem', backgroundColor: 'var(--bg-light)', borderRadius: '6px' }}>
      {icon}
    </div>
    <div>
      <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{name}</h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{desc}</p>
    </div>
  </div>
);

const AboutPage = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      
      <div className="page-header section-spacing" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <img src="/logo.svg" alt="ManifestIQ Logo" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>ManifestIQ</h1>
        <p style={{ fontSize: '1.125rem' }}>Enterprise RAG Document Intelligence Platform</p>
      </div>

      <div className="card section-spacing">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={20} color="var(--primary)" /> System Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Version</span>
            <strong style={{ color: 'var(--text-main)' }}>v1.0.0 (Production Release)</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Developer</span>
            <strong style={{ color: 'var(--text-main)' }}>Google DeepMind Advanced Agentic Coding</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>License</span>
            <strong style={{ color: 'var(--text-main)' }}>MIT Open Source</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Repository</span>
            <a href="https://github.com/manifestiq/manifestiq" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>
              <Code size={16} /> GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="section-spacing">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Technology Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <TechItem 
            icon={<LayoutTemplate size={24} />} 
            name="React & Vite" 
            desc="Frontend SPA built with React 18, React Router for navigation, and Vite for blazing fast HMR and builds." 
          />
          <TechItem 
            icon={<Server size={24} />} 
            name="FastAPI" 
            desc="High-performance async Python backend framework powering the RESTful API and streaming SSE endpoints." 
          />
          <TechItem 
            icon={<Database size={24} />} 
            name="PostgreSQL" 
            desc="Primary relational database managing user accounts, document metadata, audit logs, and query history." 
          />
          <TechItem 
            icon={<Code size={24} />} 
            name="FAISS" 
            desc="Facebook AI Similarity Search vector store used for high-speed, dense vector similarity lookups." 
          />
          <TechItem 
            icon={<Brain size={24} />} 
            name="Gemini 1.5 Flash" 
            desc="Google's advanced multimodal LLM used for both embedding generation and streaming answer synthesis." 
          />
          <TechItem 
            icon={<FileText size={24} />} 
            name="LangChain" 
            desc="Orchestration framework connecting the RAG pipeline components: loaders, splitters, vector stores, and LLMs." 
          />
        </div>
      </div>

    </motion.div>
  );
};

export default AboutPage;
