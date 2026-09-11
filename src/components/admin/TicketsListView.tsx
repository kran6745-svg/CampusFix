"use client";
import React, { useState } from 'react';
import { Ticket, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TicketsListView({ initialTickets }: { initialTickets: Ticket[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleStar = async (ticket: Ticket) => {
    const newVal = !ticket.is_starred;
    const { error } = await supabase
      .from('reports')
      .update({ is_starred: newVal })
      .eq('id', ticket.id);
    if (!error) {
      router.refresh();
    }
  };

  const handleDelete = async (id: string, ticketId: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งซ่อม ${ticketId}?\nข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบและไม่สามารถกู้คืนได้`)) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('ลบข้อมูลไม่สำเร็จ: ' + error.message);
      } else {
        toast.success(`ลบรายการ ${ticketId} สำเร็จ`);
        router.refresh();
      }
    }
  };

  // Filter tickets
  const filteredTickets = initialTickets.filter(t => {
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.room.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort: Starred first, then newest
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const displayTickets = sortedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>รายการแจ้งซ่อมทั้งหมด ({sortedTickets.length} รายการ)</CardTitle>
          <div className="flex w-full md:w-auto gap-2 flex-wrap md:flex-nowrap">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="ค้นหา Ticket ID, ชื่อ, อาคาร, ห้อง..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => {
              setStatusFilter(val || 'all');
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => {
                const headers = ['Ticket ID', 'ผู้แจ้ง', 'หมวดหมู่', 'อาคาร', 'ห้อง', 'รายละเอียด', 'สถานะ', 'วันที่'];
                const csvRows = [headers.join(',')];
                for (const t of sortedTickets) {
                  const row = [
                    t.ticket_id,
                    `"${t.first_name} ${t.last_name}"`,
                    `"${t.category}"`,
                    `"${t.building}"`,
                    `"${t.room}"`,
                    `"${t.description.replace(/"/g, '""')}"`,
                    STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG]?.label || t.status,
                    new Date(t.created_at).toLocaleDateString('th-TH')
                  ];
                  csvRows.push(row.join(','));
                }
                const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Ticket ID</TableHead>
                <TableHead>ผู้แจ้ง</TableHead>
                <TableHead>ประเภท/สถานที่</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTickets.length > 0 ? (
                displayTickets.map((ticket) => (
                  <TableRow key={ticket.id} className={ticket.is_starred ? 'bg-yellow-50/30' : ''}>
                    <TableCell>
                      <button onClick={() => toggleStar(ticket)} className="focus:outline-none transition-colors">
                        <Star className={`w-5 h-5 ${ticket.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`} />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{ticket.ticket_id}</TableCell>
                    <TableCell>
                      {ticket.first_name} {ticket.last_name}
                      <div className="text-xs text-slate-500">{ticket.department}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ticket.category}</div>
                      <div className="text-xs text-slate-500">อาคาร {ticket.building} ห้อง {ticket.room}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(ticket.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_CONFIG[ticket.status].color} hover:${STATUS_CONFIG[ticket.status].color} text-white`}>
                        {STATUS_CONFIG[ticket.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/tickets/${ticket.ticket_id}`}>
                          <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50">
                            <Eye className="w-4 h-4 mr-1" /> ดูข้อมูล
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(ticket.id, ticket.ticket_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button 
              variant="outline" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-slate-500">หน้า {currentPage} จาก {totalPages}</span>
            <Button 
              variant="outline" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              ถัดไป
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
"use client";
import React, { useState } from 'react';
import { Ticket, STATUS_CONFIG, PRIORITY_CONFIG, TECHNICIANS } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Star, Trash2, PhoneCall, Wrench } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
export default function TicketsListView({ initialTickets }: { initialTickets: Ticket[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const toggleStar = async (ticket: Ticket) => {
    const newVal = !ticket.is_starred;
    const { error } = await supabase
      .from('reports')
      .update({ is_starred: newVal })
      .eq('id', ticket.id);
    if (!error) {
      router.refresh();
    }
  };
  const handleDelete = async (id: string, ticketId: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งซ่อม ${ticketId}?`)) {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) {
        toast.error('ลบข้อมูลไม่สำเร็จ: ' + error.message);
      } else {
        toast.success(`ลบรายการ ${ticketId} สำเร็จ`);
        router.refresh();
      }
    }
  };
  const filteredTickets = initialTickets.filter(t => {
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assigned_to && t.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    
    let matchesTech = true;
    if (techFilter === 'unassigned') {
      matchesTech = !t.assigned_to;
    } else if (techFilter !== 'all') {
      matchesTech = t.assigned_to === techFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTech;
  });
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const displayTickets = sortedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return (
    <div className="space-y-6">
      {/* แถบด่วน: เบอร์โทรช่างซ่อม */}
      <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">เบอร์ติดต่อช่างซ่อมประจำระบบ</h3>
            <p className="text-xs text-slate-300">ติดต่อประสานงานหรือโทรสอบถามความคืบหน้าได้ทันที</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {TECHNICIANS.map((tech) => (
            <a
              key={tech.id}
              href={`tel:${tech.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition backdrop-blur-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-green-400" />
              <span>{tech.name}:</span>
              <span className="text-cyan-300 font-bold">{tech.phone}</span>
            </a>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex justify-between items-center flex-wrap gap-4">
            <span>รายการแจ้งซ่อมทั้งหมด ({sortedTickets.length} รายการ)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหา Ticket ID, อาคาร, ผู้แจ้ง, ช่าง..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'all'); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={techFilter} onValueChange={(val) => { setTechFilter(val || 'all'); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="กรองตามช่าง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ช่างทุกคน</SelectItem>
                <SelectItem value="unassigned">-- ยังไม่มอบหมายช่าง --</SelectItem>
                {TECHNICIANS.map((tech) => (
                  <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(val) => { setPriorityFilter(val || 'all'); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="กรองตามความเร่งด่วน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ความเร่งด่วนทั้งหมด</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-center">⭐</TableHead>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>สถานที่</TableHead>
                  <TableHead>ปัญหา / หมวดหมู่</TableHead>
                  <TableHead>ผู้แจ้ง</TableHead>
                  <TableHead>ช่างผู้รับผิดชอบ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความเร่งด่วน</TableHead>
                  <TableHead>วันที่แจ้ง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                    </TableCell>
                  </TableRow>
                ) : (
                  displayTickets.map((ticket) => {
                    const tech = TECHNICIANS.find(t => t.name === ticket.assigned_to || t.id === ticket.assigned_to);
                    return (
                      <TableRow key={ticket.id} className="hover:bg-slate-50/80 transition">
                        <TableCell className="text-center">
                          <button 
                            onClick={() => toggleStar(ticket)}
                            className={`p-1 rounded hover:bg-slate-100 transition ${ticket.is_starred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                          >
                            <Star className={`w-4 h-4 ${ticket.is_starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </TableCell>
                        <TableCell className="font-semibold text-cyan-700">
                          <Link href={`/admin/tickets/${ticket.ticket_id}`} className="hover:underline">
                            {ticket.ticket_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-800">อาคาร {ticket.building}</span>
                          <span className="text-xs text-slate-500 block">ห้อง {ticket.room}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-700">{ticket.category}</span>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">{ticket.description}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{ticket.first_name} {ticket.last_name}</span>
                          <span className="text-xs text-slate-400 block">{ticket.department}</span>
                        </TableCell>
                        <TableCell>
                          {tech ? (
                            <a 
                              href={`tel:${tech.phone.replace(/[^0-9]/g, '')}`} 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition"
                              title={`โทร: ${tech.phone}`}
                            >
                              <PhoneCall className="w-3 h-3 text-cyan-600" />
                              <span>{tech.name}</span>
                            </a>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 border-slate-200 text-xs">
                              รอช่าง
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full text-white font-medium ${STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.color}`}>
                            {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label || ticket.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]?.color}>
                            {PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(ticket.created_at).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/tickets/${ticket.ticket_id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cyan-600 hover:text-cyan-700">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(ticket.id, ticket.ticket_id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">แสดงหน้า {currentPage} จาก {totalPages} หน้า</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>ก่อนหน้า</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>ถัดไป</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
