import React, { useState } from 'react';
import { IgnorePattern } from '../types';

interface IgnorePatternsProps {
  patterns: IgnorePattern[];
  onAddPattern: (pattern: string) => void;
  onRemovePattern: (patternId: string) => void;
}

const IgnorePatterns: React.FC<IgnorePatternsProps> = ({
  patterns,
  onAddPattern,
  onRemovePattern,
}) => {
  const [newPattern, setNewPattern] = useState('');

  const handleAddPattern = () => {
    if (newPattern) {
      onAddPattern(newPattern);
      setNewPattern('');
    }
  };

  return (
    <div className="ignore-patterns">
      <h3>Ignore Patterns</h3>

      <div className="add-pattern">
        <input
          type="text"
          placeholder="Add regex pattern (e.g., \.git/*)"
          value={newPattern}
          onChange={(e) => setNewPattern(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
        />
        <button onClick={handleAddPattern}>Add</button>
      </div>

      <div className="pattern-list">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="pattern-item">
            <code>{pattern.pattern}</code>
            <button
              onClick={() => onRemovePattern(pattern.id)}
              className="remove-button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IgnorePatterns;