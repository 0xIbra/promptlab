import React, { useState } from 'react';
import { Template } from '../types';

interface TemplateManagerProps {
  templates: Template[];
  onAddTemplate: (template: Omit<Template, 'id'>) => void;
  onUseTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onAddTemplate,
  onUseTemplate,
  onDeleteTemplate,
}) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  const handleAddTemplate = () => {
    if (newTemplateName && newTemplateContent) {
      onAddTemplate({
        name: newTemplateName,
        content: newTemplateContent,
      });
      setNewTemplateName('');
      setNewTemplateContent('');
    }
  };

  return (
    <div className="template-manager">
      <div className="template-list">
        {templates.map((template) => (
          <div key={template.id} className="template-item">
            <span>{template.name}</span>
            <div className="template-actions">
              <button onClick={() => onUseTemplate(template)}>Use</button>
              <button
                onClick={() => onDeleteTemplate(template.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-template">
        <input
          type="text"
          placeholder="Template name"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
        />
        <textarea
          placeholder="Template content"
          value={newTemplateContent}
          onChange={(e) => setNewTemplateContent(e.target.value)}
        />
        <button onClick={handleAddTemplate}>Save Template</button>
      </div>
    </div>
  );
};

export default TemplateManager;