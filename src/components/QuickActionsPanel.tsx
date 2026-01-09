/**
 * Quick Actions Panel Component
 *
 * Provides quick access to common terminal commands.
 * Searchable and categorized for easy navigation.
 */

import { useState, useMemo } from 'react';
import { FiSearch, FiPlay, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import type { TerminalTheme } from '../config/themes';
import {
  ACTION_CATEGORIES,
  searchActions,
  getActionsByCategory,
  type ActionCategory,
  type QuickAction,
} from '../config/quick-actions';

interface QuickActionsPanelProps {
  theme: TerminalTheme;
  onExecuteCommand: (command: string) => void;
  onClose: () => void;
}

export function QuickActionsPanel({
  theme,
  onExecuteCommand,
  onClose,
}: QuickActionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ActionCategory>>(
    new Set(['System', 'Utilities'])
  );

  // Filter actions based on search
  const filteredActions = useMemo(() => {
    if (searchQuery.trim()) {
      return searchActions(searchQuery);
    }
    return null; // Show categorized view
  }, [searchQuery]);

  // Toggle category expansion
  const toggleCategory = (category: ActionCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Execute action
  const handleExecute = (action: QuickAction) => {
    onExecuteCommand(action.command);
    onClose();
  };

  const renderAction = (action: QuickAction) => {
    const Icon = action.icon;
    return (
      <button
        key={action.id}
        onClick={() => handleExecute(action)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '10px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          color: theme.colors.foreground,
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title={action.description}
      >
        <Icon size={14} color={theme.colors.cyan} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500 }}>{action.name}</div>
          {action.description && (
            <div
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {action.description}
            </div>
          )}
        </div>
        <FiPlay size={12} color="#6b7280" />
      </button>
    );
  };

  return (
    <div
      style={{
        width: '320px',
        maxHeight: '400px',
        backgroundColor: theme.colors.background,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <FiSearch size={14} color="#6b7280" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.colors.foreground,
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
            autoFocus
          />
        </div>
      </div>

      {/* Actions List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {filteredActions ? (
          // Search results
          filteredActions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredActions.map(renderAction)}
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              No commands found
            </div>
          )
        ) : (
          // Categorized view
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ACTION_CATEGORIES.map((category) => {
              const actions = getActionsByCategory(category);
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#9ca3af',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.colors.foreground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                    {category}
                    <span style={{ marginLeft: 'auto', opacity: 0.6 }}>
                      {actions.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        marginLeft: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      {actions.map(renderAction)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        Click a command to execute
      </div>
    </div>
  );
}
