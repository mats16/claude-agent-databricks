import { memo, useMemo } from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

// Marker for structured SQL result data (must match backend)
const SQL_RESULT_MARKER = '<!--SQL_RESULT-->';

interface SQLResultData {
  columns: string[];
  rows: unknown[][];
  totalRows: number;
  truncated: boolean;
}

interface SqlResultTableProps {
  data: SQLResultData;
}

// Parse SQL result from tool output
export function parseSqlResult(content: string): SQLResultData | null {
  if (!content.startsWith(SQL_RESULT_MARKER)) {
    return null;
  }
  try {
    const json = content.slice(SQL_RESULT_MARKER.length);
    return JSON.parse(json) as SQLResultData;
  } catch {
    return null;
  }
}

// Format cell value for display
function formatCellValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return (
      <Text type="secondary" italic>
        NULL
      </Text>
    );
  }
  const strValue = String(value);
  if (strValue.length > 100) {
    return <span title={strValue}>{strValue.slice(0, 100)}...</span>;
  }
  return strValue;
}

export default memo(function SqlResultTable({ data }: SqlResultTableProps) {
  const columns: ColumnsType<Record<string, unknown>> = useMemo(
    () =>
      data.columns.map((col, index) => ({
        title: col,
        dataIndex: String(index),
        key: col,
        ellipsis: true,
        render: (value: unknown) => formatCellValue(value),
      })),
    [data.columns]
  );

  const dataSource = useMemo(
    () =>
      data.rows.map((row, rowIndex) => {
        const record: Record<string, unknown> = { key: rowIndex };
        row.forEach((value, colIndex) => {
          record[String(colIndex)] = value;
        });
        return record;
      }),
    [data.rows]
  );

  return (
    <div className="sql-result-table">
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content', y: 300 }}
        bordered
      />
      {data.truncated && (
        <Text
          type="secondary"
          style={{ fontSize: 12, marginTop: 8, display: 'block' }}
        >
          Results truncated. Showing {data.rows.length} of {data.totalRows}{' '}
          rows.
        </Text>
      )}
    </div>
  );
});
