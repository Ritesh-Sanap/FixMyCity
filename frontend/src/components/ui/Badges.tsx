import React from 'react'
import { IssueStatus, STATUS_LABELS } from '../../types'

interface Props {
  status: IssueStatus | string
  size?: 'sm' | 'md'
}

const STATUS_CLASS: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-600',
  ai_verified: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  work_started: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-emerald-100 text-emerald-800 font-semibold',
  reopened: 'bg-red-100 text-red-700',
}

const PRIORITY_CLASS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low: 'bg-green-100 text-green-700 border border-green-200',
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const cls = STATUS_CLASS[status] || 'bg-gray-100 text-gray-600'
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${padding} ${cls}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority, size = 'sm' }: { priority: string; size?: 'sm' | 'md' }) {
  const cls = PRIORITY_CLASS[priority] || 'bg-gray-100 text-gray-600'
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${padding} ${cls}`}>
      {priority}
    </span>
  )
}

import {
  AlertOctagon, Trash2, Droplets, LightbulbOff, Construction, MapPin, Sparkles, Disc
} from 'lucide-react'

export function CategoryIcon({ category, size = 18 }: { category: string; size?: number }) {
  switch (category) {
    case 'pothole':
      return <Disc size={size} className="text-amber-600" />
    case 'garbage':
      return <Trash2 size={size} className="text-emerald-600" />
    case 'water_leakage':
      return <Droplets size={size} className="text-blue-600" />
    case 'broken_streetlight':
      return <LightbulbOff size={size} className="text-amber-500" />
    case 'damaged_road':
      return <Construction size={size} className="text-orange-600" />
    case 'auto':
      return <Sparkles size={size} className="text-[#FF9933]" />
    default:
      return <MapPin size={size} className="text-slate-600" />
  }
}
