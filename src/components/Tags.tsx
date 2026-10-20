import { Tag } from 'antd'
import type { ReactNode } from 'react'
import {
  DOC_STATUS_COLORS,
  DOC_STATUS_LABELS,
  ISSUE_SEVERITY_COLORS,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_COLORS,
  ISSUE_STATUS_LABELS,
  KNOWLEDGE_TYPE_COLORS,
  KNOWLEDGE_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../constants'
import type {
  DocumentStatus,
  IssueSeverity,
  IssueStatus,
  KnowledgeType,
  Priority,
} from '../types'

export function SoftTag({ color, children }: { color: string; children: ReactNode }) {
  return (
    <Tag
      style={{
        color,
        background: `${color}14`,
        borderColor: `${color}33`,
        marginInlineEnd: 0,
        fontWeight: 500,
      }}
    >
      {children}
    </Tag>
  )
}

export function PriorityTag({ value }: { value: Priority }) {
  return <SoftTag color={PRIORITY_COLORS[value]}>{PRIORITY_LABELS[value]}</SoftTag>
}

export function IssueSeverityTag({ value }: { value: IssueSeverity }) {
  return <SoftTag color={ISSUE_SEVERITY_COLORS[value]}>{ISSUE_SEVERITY_LABELS[value]}</SoftTag>
}

export function IssueStatusTag({ value }: { value: IssueStatus }) {
  return <SoftTag color={ISSUE_STATUS_COLORS[value]}>{ISSUE_STATUS_LABELS[value]}</SoftTag>
}

export function DocStatusTag({ value }: { value: DocumentStatus }) {
  return <SoftTag color={DOC_STATUS_COLORS[value]}>{DOC_STATUS_LABELS[value]}</SoftTag>
}

export function KnowledgeTypeTag({ value }: { value: KnowledgeType }) {
  return <SoftTag color={KNOWLEDGE_TYPE_COLORS[value]}>{KNOWLEDGE_TYPE_LABELS[value]}</SoftTag>
}
