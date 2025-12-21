import { useState, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import {
  DownOutlined,
  UpOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ImageContent } from '@app/shared';
import FilePreviewModal from './FilePreviewModal';
import SqlResultTable, { parseSqlResult } from './SqlResultTable';
import { colors } from '../styles/theme';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'agent';
  images?: ImageContent[];
  sessionId?: string;
}

interface ParsedBlock {
  type: 'text' | 'tool';
  content: string;
  toolName?: string;
  toolInput?: string;
  toolDisplayInput?: string;
  toolOutput?: string;
}

function formatToolInput(toolName: string, inputJson: string): string {
  if (!inputJson) return '';

  try {
    const input = JSON.parse(inputJson);

    // Format based on tool type
    switch (toolName) {
      case 'Bash':
        return input.command || '';
      case 'Read':
        return input.file_path || '';
      case 'Write':
        return input.file_path || '';
      case 'Edit':
        return input.file_path || '';
      case 'NotebookEdit':
        return input.notebook_path || input.file_path || '';
      case 'Glob':
        return input.pattern || '';
      case 'Grep':
        return input.pattern || '';
      case 'WebSearch':
        return input.query || '';
      case 'WebFetch':
        return input.url || '';
      default:
        // For other tools, exclude large content fields and show a shortened version
        const sanitized = { ...input };
        if (sanitized.content) {
          delete sanitized.content;
        }
        if (sanitized.new_source) {
          delete sanitized.new_source;
        }
        const str = JSON.stringify(sanitized);
        return str.length > 80 ? str.slice(0, 80) + '...' : str;
    }
  } catch {
    return inputJson.length > 80 ? inputJson.slice(0, 80) + '...' : inputJson;
  }
}

function formatToolOutput(
  toolName: string,
  output: string,
  t: (key: string, params?: Record<string, unknown>) => string
): string | null {
  if (!output) return null;

  // Hide output for certain tools
  if (
    toolName === 'Glob' ||
    toolName === 'Skill' ||
    toolName === 'Write' ||
    toolName === 'NotebookEdit' ||
    toolName === 'WebSearch'
  ) {
    return null;
  }

  // For Read tool, show only line count
  if (toolName === 'Read') {
    const lines = output.trim().split('\n');
    return t('toolOutput.linesRead', { count: lines.length });
  }

  // For other tools, show the output as-is
  return output;
}

function parseAgentMessage(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  // Pattern to match tool calls with optional ID and results
  // [Tool: ToolName] {json} or [Tool: ToolName id=xxx] {json}
  // followed by optional [ToolResult]...[/ToolResult]
  const combinedPattern =
    /\[Tool:\s*(\w+)(?:\s+id=[^\]]+)?\]\s*(\{[^]*?\})?(?:\s*\[ToolResult\]\n?([\s\S]*?)\[\/ToolResult\])?/g;

  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(content)) !== null) {
    // Add text before this tool call
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      // Remove any standalone [ToolResult] blocks from text
      const cleanedText = textBefore
        .replace(/\[ToolResult\][\s\S]*?\[\/ToolResult\]/g, '')
        .trim();
      if (cleanedText) {
        blocks.push({
          type: 'text',
          content: cleanedText,
        });
      }
    }

    const toolName = match[1];
    const toolInputJson = match[2] || '';
    const toolOutput = match[3]?.trim() || '';
    const displayInput = formatToolInput(toolName, toolInputJson);

    // Add tool block
    blocks.push({
      type: 'tool',
      content: match[0],
      toolName: toolName,
      toolInput: toolInputJson,
      toolDisplayInput: displayInput,
      toolOutput: toolOutput,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last tool call
  let remaining = content.slice(lastIndex).trim();
  // Remove any standalone [ToolResult] blocks
  remaining = remaining
    .replace(/\[ToolResult\][\s\S]*?\[\/ToolResult\]/g, '')
    .trim();
  if (remaining) {
    blocks.push({
      type: 'text',
      content: remaining,
    });
  }

  return blocks;
}

const CollapsibleOutput = memo(function CollapsibleOutput({
  content,
  toolName,
}: {
  content: string;
  toolName?: string;
}) {
  const lines = content.split('\n');
  const MAX_COLLAPSED_LINES = 3;

  // Check if this is SQL result data (marker-based detection)
  const sqlResult = parseSqlResult(content);

  // MCP tools always collapse, other tools collapse if they have 4+ lines
  const isMcpTool = toolName?.startsWith('mcp__');
  const needsCollapse =
    sqlResult || isMcpTool || lines.length > MAX_COLLAPSED_LINES;

  // SQL results and MCP tools start collapsed, others start expanded if short
  const [isExpanded, setIsExpanded] = useState(!needsCollapse);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    marginTop: '4px',
    border: `1px solid ${colors.borderAntd}`,
    borderRadius: '4px',
    background: colors.backgroundTertiary,
    cursor: 'pointer',
    fontSize: '12px',
    color: colors.textSecondary,
  };

  // SQL result rendering with Ant Design Table
  if (sqlResult) {
    const rowInfo = sqlResult.truncated
      ? `${sqlResult.rows.length} of ${sqlResult.totalRows} rows`
      : `${sqlResult.rows.length} rows`;

    if (!isExpanded) {
      return (
        <div>
          <button onClick={() => setIsExpanded(true)} style={buttonStyle}>
            <DownOutlined style={{ fontSize: '10px' }} />
            <span>{rowInfo}</span>
          </button>
        </div>
      );
    }

    return (
      <div style={{ minWidth: 0, width: '100%' }}>
        <SqlResultTable data={sqlResult} />
        <button onClick={() => setIsExpanded(false)} style={buttonStyle}>
          <UpOutlined style={{ fontSize: '10px' }} />
          <span>Show less</span>
        </button>
      </div>
    );
  }

  // Non-SQL tool output rendering
  if (!needsCollapse) {
    return <pre className="tool-output-content">{content}</pre>;
  }

  // Calculate collapsed content (line-based for all tools)
  // MCP tools show 0 lines when collapsed, others show up to MAX_COLLAPSED_LINES
  const collapsedLineCount = isMcpTool ? 0 : MAX_COLLAPSED_LINES;
  const collapsedContent = lines.slice(0, collapsedLineCount).join('\n');
  const hiddenLines = lines.length - collapsedLineCount;
  const hiddenInfo = `${hiddenLines} lines`;

  const displayContent = isExpanded ? content : collapsedContent;

  if (isExpanded) {
    // When expanded, make the entire content clickable to collapse
    return (
      <div
        onClick={() => setIsExpanded(false)}
        style={{ cursor: 'pointer' }}
        title="Click to collapse"
      >
        <pre className="tool-output-content">{displayContent}</pre>
        <button style={buttonStyle}>
          <UpOutlined style={{ fontSize: '10px' }} />
          <span>Show less</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <pre className="tool-output-content">{displayContent}</pre>
      <button onClick={() => setIsExpanded(true)} style={buttonStyle}>
        <DownOutlined style={{ fontSize: '10px' }} />
        <span>{hiddenInfo}</span>
      </button>
    </div>
  );
});

const MarkdownContent = memo(function MarkdownContent({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom code block rendering
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className;

          if (isInline) {
            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Custom pre rendering for code blocks
        pre({ children }) {
          return <pre className="code-block">{children}</pre>;
        },
        // Custom link rendering
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

// Check if file is a PDF based on extension
function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf');
}

// File card component for @file_name patterns (card style)
const FileCard = memo(function FileCard({
  filePath,
  onClick,
}: {
  filePath: string;
  onClick: () => void;
}) {
  const fileName = filePath.split('/').pop() || filePath;
  const isPdf = isPdfFileName(fileName);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 6,
        border: `1px solid ${colors.borderDark}`,
        background: colors.backgroundTertiary,
        cursor: 'pointer',
        maxWidth: 220,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = colors.backgroundHover)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = colors.backgroundTertiary)
      }
      title={fileName}
    >
      {isPdf ? (
        <FilePdfOutlined
          style={{ fontSize: 18, color: colors.danger, flexShrink: 0 }}
        />
      ) : (
        <FileTextOutlined
          style={{ fontSize: 18, color: colors.info, flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: colors.textHeading,
          }}
        >
          {fileName}
        </div>
        {isPdf && (
          <div style={{ fontSize: 10, color: colors.textMuted }}>PDF</div>
        )}
      </div>
    </div>
  );
});

// Parse text to extract @file_path patterns and remaining text
function parseTextWithFiles(text: string): {
  files: string[];
  textContent: string;
} {
  // Pattern to match @file_path (supports subdirectories with slashes)
  // Matches: @file.txt, @dir/file.txt, @path/to/file.txt
  const filePattern = /@([\w./-]+)/g;
  const files: string[] = [];
  let match;

  while ((match = filePattern.exec(text)) !== null) {
    files.push(match[1]);
  }

  // Remove @file references from text to get clean text content
  const textContent = text.replace(/@[\w./-]+/g, '').trim();

  return { files, textContent };
}

export default memo(function MessageRenderer({
  content,
  role,
  images,
  sessionId,
}: MessageRendererProps) {
  const { t } = useTranslation();
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  if (role === 'user') {
    // Parse content to extract file references and text
    const { files, textContent } = content
      ? parseTextWithFiles(content)
      : { files: [], textContent: '' };

    return (
      <div className="user-message">
        {/* Images */}
        {images && images.length > 0 && (
          <div
            className="user-images"
            style={{ marginBottom: content || files.length > 0 ? 12 : 0 }}
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={`data:${img.source.media_type};base64,${img.source.data}`}
                alt="uploaded_image"
                className="uploaded-image"
                style={{
                  maxWidth: 300,
                  maxHeight: 300,
                  borderRadius: 8,
                  marginRight: 8,
                  marginBottom: 8,
                  objectFit: 'contain',
                }}
              />
            ))}
          </div>
        )}
        {/* File cards */}
        {files.length > 0 && sessionId && (
          <div
            className="user-files"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: textContent ? 12 : 0,
            }}
          >
            {files.map((filePath, idx) => (
              <FileCard
                key={idx}
                filePath={filePath}
                onClick={() => setPreviewFile(filePath)}
              />
            ))}
          </div>
        )}
        {/* Text content */}
        {textContent && <pre className="message-text">{textContent}</pre>}
        {/* File preview modal */}
        {sessionId && previewFile && (
          <FilePreviewModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            filePath={previewFile}
            sessionId={sessionId}
          />
        )}
      </div>
    );
  }

  const blocks = parseAgentMessage(content);

  // If no tool blocks, render as markdown
  const hasToolBlocks = blocks.some((b) => b.type === 'tool');

  if (!hasToolBlocks) {
    return (
      <div className="markdown-content">
        <MarkdownContent content={content} />
      </div>
    );
  }

  return (
    <div className="message-formatted">
      {blocks.map((block, idx) => {
        if (block.type === 'tool') {
          const formattedOutput = block.toolOutput
            ? formatToolOutput(block.toolName || '', block.toolOutput, t)
            : null;

          return (
            <div key={idx} className="tool-block">
              <div className="tool-header">
                <span className="tool-name">{block.toolName}</span>
                {block.toolDisplayInput && (
                  <code className="tool-input">{block.toolDisplayInput}</code>
                )}
              </div>
              {formattedOutput && (
                <div className="tool-output">
                  <span className="tool-output-connector">└</span>
                  <CollapsibleOutput
                    content={formattedOutput}
                    toolName={block.toolName}
                  />
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div key={idx} className="text-block markdown-content">
              <MarkdownContent content={block.content} />
            </div>
          );
        }
      })}
    </div>
  );
});
