"use client";
import React from 'react';
import { Ticket, STATUS_CONFIG } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, PlayCircle, CheckCircle, Eye, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardView({ initialTickets }: { initialTickets: Ticket[] }) {
  const router = useRouter();
  
  // Calculate stats
  const total = initialTickets.length;
  const pending = initialTickets.filter(t => t.status === 'pending').length;
  const inProgress = initialTickets.filter(t => ['acknowledged', 'in_progress'].includes(t.status)).length;
  const completed = initialTickets.filter(t => ['completed', 'closed'].includes(t.status)).length;

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

  // Sort: Starred first, then newest
  const sortedTickets = [...initialTickets].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayTickets = sortedTickets.slice(0, 10);

  return (
    <div className="space-y-6 mt-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">งานทั้งหมด</CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">รอรับเรื่อง</CardTitle>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">กำลังดำเนินการ</CardTitle>
            <PlayCircle className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">เสร็จสิ้น/ปิดงาน</CardTitle>
            <CheckCircle className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>รายการแจ้งซ่อมล่าสุด (10 รายการ)</CardTitle>
            <Link href="/admin/tickets">
              <Button variant="outline">
                ดูรายการทั้งหมด
              </Button>
            </Link>
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
        </CardContent>
      </Card>
    </div>
  );
}
"use client";
import React from 'react';
import { Ticket, STATUS_CONFIG, TECHNICIANS } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Clock, PlayCircle, CheckCircle, Eye, Star, Trash2, PhoneCall, Wrench } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
export default function DashboardView({ initialTickets }: { initialTickets: Ticket[] }) {
  const router = useRouter();
  
  const total = initialTickets.length;
  const pending = initialTickets.filter(t => t.status === 'pending').length;
  const inProgress = initialTickets.filter(t => ['acknowledged', 'in_progress'].includes(t.status)).length;
  const completed = initialTickets.filter(t => ['completed', 'closed'].includes(t.status)).length;
  const toggleStar = async (ticket: Ticket) => {
    const newVal = !ticket.is_starred;
    const { error } = await supabase.from('reports').update({ is_starred: newVal }).eq('id', ticket.id);
    if (!error) router.refresh();
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
  const sortedTickets = [...initialTickets].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">งานทั้งหมด</CardTitle>
            <FileText className="h-5 w-5 text-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{total}</div>
            <p className="text-xs text-slate-500 mt-1">รายการแจ้งซ่อมสะสม</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">รอรับเรื่อง</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pending}</div>
            <p className="text-xs text-slate-500 mt-1">ต้องเข้าตรวจสอบ/มอบหมาย</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">กำลังดำเนินการ</CardTitle>
            <PlayCircle className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{inProgress}</div>
            <p className="text-xs text-slate-500 mt-1">ช่างกำลังซ่อมแซม</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">เสร็จสิ้นแล้ว</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completed}</div>
            <p className="text-xs text-slate-500 mt-1">งานที่ปิดเรียบร้อยแล้ว</p>
          </CardContent>
        </Card>
      </div>
      <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50/50 via-white to-slate-50 shadow-sm">
        <CardHeader className="pb-3 border-b border-cyan-100">
          <CardTitle className="text-base font-bold flex items-center justify-between text-cyan-950 flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-600" /> ทีมช่างซ่อมบำรุงประจำสถานศึกษา
            </span>
            <span className="text-xs font-normal text-slate-500">โทรติดต่อได้โดยตรง</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TECHNICIANS.map((tech) => {
              const techTickets = initialTickets.filter(t => t.assigned_to === tech.name || t.assigned_to === tech.id);
              const activeCount = techTickets.filter(t => ['pending', 'acknowledged', 'in_progress', 'waiting'].includes(t.status)).length;
              
              return (
                <div 
                  key={tech.id} 
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center text-base">
                      {tech.name.replace('อ.', '').slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm md:text-base">{tech.name}</h4>
                      <p className="text-xs text-slate-500">{tech.role} • มีงานในมือ <span className="font-semibold text-cyan-700">{activeCount} งาน</span></p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{tech.phone}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${tech.phone.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>โทรหาช่าง</span>
                  </a>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">รายการแจ้งซ่อมล่าสุด</CardTitle>
          <Link href="/admin/tickets">
            <Button variant="outline" size="sm" className="text-cyan-600 hover:text-cyan-700">
              ดูทั้งหมด
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-center">⭐</TableHead>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>สถานที่</TableHead>
                  <TableHead>ปัญหา</TableHead>
                  <TableHead>ผู้แจ้ง</TableHead>
                  <TableHead>ช่างผู้รับผิดชอบ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่แจ้ง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      ยังไม่มีรายการแจ้งซ่อมในระบบ
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTickets.slice(0, 10).map((ticket) => {
                    const tech = TECHNICIANS.find(t => t.name === ticket.assigned_to || t.id === ticket.assigned_to);
                    return (
                      <TableRow key={ticket.id} className="hover:bg-slate-50/80 transition">
                        <TableCell className="text-center">
                          <button 
                            onClick={() => toggleStar(ticket)}
                            className={`p-1 rounded hover:bg-slate-100 transition ${ticket.is_starred ? 'text-amber-500' : 'text-slate-300'}`}
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
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{ticket.description}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{ticket.first_name} {ticket.last_name}</span>
                        </TableCell>
                        <TableCell>
                          {tech ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-medium">
                              <Wrench className="w-3 h-3 text-cyan-600" />
                              {tech.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">ยังไม่มอบหมาย</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full text-white font-medium ${STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.color}`}>
                            {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label || ticket.status}
                          </span>
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
        </CardContent>
      </Card>
    </div>
  );
