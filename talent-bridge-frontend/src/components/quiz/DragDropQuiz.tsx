import { useCallback, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Question, QuestionOption } from '../../types';

const DRAG_TYPE = 'QUIZ_COMPONENT';

/* ── Emoji mapping ─────────────────────────────────────────── */
function getEmoji(optionText: string): string {
  const t = optionText.toLowerCase();
  if (t.includes('ups') || t.includes('uninterruptible') || t.includes('battery') || t.includes('power supply')) return '🔋';
  if (t.includes('server') || t.includes('rack') || t.includes('blade') || t.includes('compute')) return '🖥️';
  if (
    t.includes('cooling') || t.includes('crac') || t.includes('crah') ||
    t.includes('hvac') || t.includes('chiller') || t.includes('air')
  ) return '❄️';
  if (
    t.includes('switch') || t.includes('network') || t.includes('router') ||
    t.includes('firewall') || t.includes('ids') || t.includes('ips') ||
    t.includes('patch') || t.includes('load balancer')
  ) return '🔀';
  return '📦';
}

/* ── Zone config ─────────────────────────────────────────── */
const DATACENTER_ZONES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Power Zone', icon: '⚡' },
  1: { label: 'Network Zone', icon: '🌐' },
  2: { label: 'Compute Zone', icon: '💻' },
  3: { label: 'Cooling Zone', icon: '❄️' },
};

const SECURITY_ZONES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Prevention', icon: '🛡️' },
  1: { label: 'Detection', icon: '🔍' },
  2: { label: 'Response', icon: '⚡' },
  3: { label: 'Recovery', icon: '♻️' },
};

/**
 * Detect zone type from question options content.
 * If option texts include security-related terms, use security zones.
 */
function detectZoneType(options: { optionText: string }[]): 'datacenter' | 'security' {
  const securityKeywords = [
    'firewall', 'ids', 'ips', 'incident', 'backup', 'restore', 'siem',
    'forensic', 'iptables', 'snort', 'metasploit', 'rsync', 'mfa',
    'authentication', 'disaster recovery', 'prevention', 'detection',
  ];
  const combined = options.map((o) => o.optionText.toLowerCase()).join(' ');
  return securityKeywords.some((kw) => combined.includes(kw)) ? 'security' : 'datacenter';
}

/* ── Drag item type ─────────────────────────────────────────── */
interface DragItem {
  type: typeof DRAG_TYPE;
  optionId: string;
  optionText: string;
  emoji: string;
  fromSlot: string | null; // slotPosition as string, or null if from palette
}

/* ── Draggable Component ─────────────────────────────────────── */
function DraggableComponent({
  option,
  isPlaced,
  fromSlot,
}: {
  option: QuestionOption;
  isPlaced: boolean;
  fromSlot: string | null;
}) {
  const emoji = getEmoji(option.optionText);

  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: DRAG_TYPE,
    item: { type: DRAG_TYPE, optionId: option.id, optionText: option.optionText, emoji, fromSlot },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // useDrag returns [collected, ref, previewRef] — ref must be attached via callback
  const ref = useRef<HTMLDivElement>(null);
  dragRef(ref);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`Drag ${option.optionText}`}
      aria-grabbed={isDragging}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '90px',
        height: '90px',
        backgroundColor: 'var(--pixel-card)',
        border: `3px solid ${isPlaced ? '#334' : '#556'}`,
        boxShadow: isDragging ? 'none' : '3px 3px 0 #000',
        cursor: 'grab',
        opacity: isDragging ? 0.3 : isPlaced ? 0.45 : 1,
        transition: 'opacity 0.15s, box-shadow 0.1s',
        userSelect: 'none',
        padding: '0.4rem',
        gap: '0.3rem',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '1.75rem', lineHeight: 1 }} aria-hidden="true">
        {emoji}
      </span>
      <span
        className="pixel-font"
        style={{
          fontSize: '0.35rem',
          color: isPlaced ? '#556' : '#ccc',
          textAlign: 'center',
          lineHeight: 1.4,
          wordBreak: 'break-word',
          maxWidth: '75px',
        }}
      >
        {option.optionText.toUpperCase()}
      </span>
    </div>
  );
}

/* ── Drop Zone ─────────────────────────────────────────────── */
function DropZone({
  zoneIndex,
  droppedItem,
  onDrop,
  zoneLabels,
}: {
  zoneIndex: number;
  droppedItem: { optionId: string; optionText: string; emoji: string } | null;
  onDrop: (zoneIndex: number, item: DragItem) => void;
  zoneLabels: Record<number, { label: string; icon: string }>;
}) {
  const zone = zoneLabels[zoneIndex] ?? { label: `Zone ${zoneIndex}`, icon: '📦' };

  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>({
    accept: DRAG_TYPE,
    drop: (item) => onDrop(zoneIndex, item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const ref = useRef<HTMLDivElement>(null);
  dropRef(ref);

  const isDraggingOver = isOver && canDrop;

  return (
    <div
      ref={ref}
      role="region"
      aria-label={`${zone.icon} ${zone.label} drop zone`}
      aria-dropeffect="move"
      style={{
        minHeight: '130px',
        border: `3px dashed ${isDraggingOver ? '#2ecc71' : droppedItem ? 'var(--pixel-gold)' : '#446'}`,
        backgroundColor: isDraggingOver
          ? 'rgba(46, 204, 113, 0.08)'
          : droppedItem
          ? 'rgba(255, 215, 0, 0.04)'
          : 'rgba(10, 18, 40, 0.5)',
        boxShadow: isDraggingOver ? '0 0 10px rgba(46,204,113,0.3), inset 0 0 10px rgba(46,204,113,0.05)' : 'none',
        transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: '0.75rem',
        position: 'relative',
      }}
    >
      {/* Zone label header */}
      <div
        style={{
          position: 'absolute',
          top: '0.4rem',
          left: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <span style={{ fontSize: '0.75rem' }} aria-hidden="true">
          {zone.icon}
        </span>
        <span
          className="pixel-font"
          style={{ fontSize: '0.35rem', color: isDraggingOver ? '#2ecc71' : '#668', letterSpacing: '0.03em' }}
        >
          {zone.label.toUpperCase()}
        </span>
      </div>

      {/* Drop placeholder or placed item */}
      {droppedItem ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.3rem',
            marginTop: '1.1rem',
          }}
        >
          <span style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">
            {droppedItem.emoji}
          </span>
          <span
            className="pixel-font"
            style={{ fontSize: '0.35rem', color: 'var(--pixel-gold)', textAlign: 'center', lineHeight: 1.4 }}
          >
            {droppedItem.optionText.toUpperCase()}
          </span>
        </div>
      ) : (
        <div
          style={{
            marginTop: '1.5rem',
            color: isDraggingOver ? '#2ecc71' : '#335',
            fontSize: '0.7rem',
            textAlign: 'center',
          }}
          aria-hidden="true"
        >
          {isDraggingOver ? '✅ DROP HERE' : '···'}
        </div>
      )}
    </div>
  );
}

/* ── DragDropQuiz ───────────────────────────────────────────── */
interface DragDropQuizProps {
  question: Question;
  onMappingChange: (mapping: Record<string, string>) => void;
  /** Optionally restore a previously saved mapping (e.g. when navigating back) */
  initialMapping?: Record<string, string>;
}

/**
 * mapping: { [slotPosition as string]: optionId }
 * placed:  { [optionId]: slotPosition as string }  (reverse index for quick lookup)
 */
export default function DragDropQuiz({ question, onMappingChange, initialMapping = {} }: DragDropQuizProps) {
  // mapping: slotPosition (string) -> optionId
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  // Detect zone type from question options
  const zoneLabels = detectZoneType(question.options) === 'security'
    ? SECURITY_ZONES
    : DATACENTER_ZONES;

  // Compute reverse map: optionId -> slotPosition string (for palette "isPlaced" check)
  const placedOptions: Record<string, string> = {};
  for (const [slot, optId] of Object.entries(mapping)) {
    placedOptions[optId] = slot;
  }

  const handleDrop = useCallback(
    (zoneIndex: number, item: DragItem) => {
      const slotKey = String(zoneIndex);

      setMapping((prev) => {
        const next = { ...prev };

        // If item came from another slot, clear that slot
        if (item.fromSlot !== null && item.fromSlot !== slotKey) {
          delete next[item.fromSlot];
        }

        // If this slot already has a different item, it gets evicted back to palette
        // (no special state needed — it just won't be in mapping anymore)
        if (next[slotKey] && next[slotKey] !== item.optionId) {
          // evict previous occupant — nothing to do except delete it
          delete next[slotKey];
        }

        next[slotKey] = item.optionId;

        // Notify parent
        onMappingChange(next);
        return next;
      });
    },
    [onMappingChange]
  );

  // Build placed item info for each zone
  const getDroppedItem = (zoneIndex: number) => {
    const optId = mapping[String(zoneIndex)];
    if (!optId) return null;
    const opt = question.options.find((o) => o.id === optId);
    if (!opt) return null;
    return { optionId: optId, optionText: opt.optionText, emoji: getEmoji(opt.optionText) };
  };

  return (
    <div aria-label="Drag and drop quiz">
      {/* Instruction banner */}
      <div
        style={{
          padding: '0.5rem 0.75rem',
          marginBottom: '1.25rem',
          backgroundColor: '#0a1228',
          border: '2px solid #334',
          borderLeft: '4px solid var(--pixel-gold)',
          fontSize: '0.72rem',
          color: '#aaa',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span aria-hidden="true">💡</span>
        <span>Drag each component to the correct zone below.</span>
      </div>

      {/* Draggable palette */}
      <div
        aria-label="Draggable components palette"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#0d1627',
          border: '2px solid #223',
        }}
      >
        <span
          className="pixel-font"
          style={{
            width: '100%',
            fontSize: '0.38rem',
            color: '#556',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
          }}
          aria-hidden="true"
        >
          COMPONENTS — DRAG TO PLACE:
        </span>
        {question.options.map((opt) => {
          const isPlaced = opt.id in placedOptions;
          const fromSlot = placedOptions[opt.id] ?? null;
          return (
            <DraggableComponent
              key={opt.id}
              option={opt}
              isPlaced={isPlaced}
              fromSlot={fromSlot}
            />
          );
        })}
      </div>

      {/* Drop zones — 2×2 grid */}
      <div
        aria-label="Drop zones"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}
      >
        {[0, 1, 2, 3].map((zoneIndex) => (
          <DropZone
            key={zoneIndex}
            zoneIndex={zoneIndex}
            droppedItem={getDroppedItem(zoneIndex)}
            onDrop={handleDrop}
            zoneLabels={zoneLabels}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.65rem',
          color: '#556',
          textAlign: 'right',
        }}
        aria-live="polite"
        aria-label={`${Object.keys(mapping).length} of 4 zones filled`}
      >
        <span className="pixel-font" style={{ fontSize: '0.35rem' }}>
          {Object.keys(mapping).length}/4 ZONES FILLED
        </span>
      </div>
    </div>
  );
}
