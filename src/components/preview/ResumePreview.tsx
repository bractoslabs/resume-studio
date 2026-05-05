import React from "react";

export const ResumePreview = ({ renderedHtml, pageStyle, templateId, pageSize, zoom, warnings }: { renderedHtml: string; pageStyle: React.CSSProperties; templateId: string; pageSize: string; zoom: number; warnings: number }) => (
  <div className="page-wrap" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
    <article className={`resume-page page-${pageSize} template-${templateId}`} style={pageStyle}>
      {warnings > 0 && <span className="overflow-warning">{warnings} review items</span>}
      <div className="resume-content" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </article>
  </div>
);
