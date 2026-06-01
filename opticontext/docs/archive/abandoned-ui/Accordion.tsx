import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {items.map((item, idx) => {
        const isOpen = openIds.has(item.id);
        return (
          <div
            key={item.id}
            style={{
              borderBottom: '1px solid var(--border)',
              borderLeft: isOpen ? '1px solid var(--accent)' : '1px solid transparent',
              paddingLeft: isOpen ? 15 : 16,
              transition: 'border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <button
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '20px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: '1.25rem',
                color: 'var(--text-primary)',
                textAlign: 'left',
                gap: 16,
              }}
            >
              <span>{item.title}</span>
              <ChevronDown
                size={18}
                style={{
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </button>
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              style={{
                maxHeight: isOpen ? 2000 : 0,
                overflow: 'hidden',
                  transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div
                  style={{
                    paddingBottom: 20,
                    fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                }}
              >
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
