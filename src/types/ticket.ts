export interface TicketTimeline {
  status: string;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  department: string;
  phone: string;
  building: string;
  room: string;
  category: string;
  description: string;
  image_urls: string[];
  status: 'pending' | 'acknowledged' | 'in_progress' | 'waiting' | 'completed' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timeline: TicketTimeline[];
  is_starred?: boolean;
  created_at: string;
  updated_at: string;
}
export const TECHNICIANS: Technician[] = [
  { id: 'อ.ภัคนันท์', name: 'อ.ภัคนันท์', phone: '082-0011916', role: 'ช่างซ่อม' },
  { id: 'อ.อรทัย', name: 'อ.อรทัย', phone: '099-3932322', role: 'ช่างซ่อม' },
];

export const STATUS_CONFIG = {
  pending: { label: 'รอรับเรื่อง', color: 'bg-yellow-500' },
  acknowledged: { label: 'รับเรื่องแล้ว', color: 'bg-blue-500' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-purple-500' },
  waiting: { label: 'รออะไหล่ / รอข้อมูล', color: 'bg-orange-500' },
  completed: { label: 'ดำเนินการเสร็จแล้ว', color: 'bg-green-500' },
  closed: { label: 'ปิดงาน', color: 'bg-slate-800' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-500' },
} as const;

export const PRIORITY_CONFIG = {
  low: { label: 'ต่ำ', color: 'text-slate-500 bg-slate-100' },
  normal: { label: 'ปานกลาง', color: 'text-blue-600 bg-blue-100' },
  high: { label: 'สูง', color: 'text-orange-600 bg-orange-100' },
  urgent: { label: 'ด่วน', color: 'text-red-600 bg-red-100' },
} as const;
