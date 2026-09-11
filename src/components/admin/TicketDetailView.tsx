"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Ticket, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Wrench, User, Phone, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TicketDetailView({ initialTicket }: { initialTicket: Ticket }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [status, setStatus] = useState<string>(initialTicket.status);
  const [priority, setPriority] = useState<string>(initialTicket.priority);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newTimelineEvent = {
        status,
        timestamp: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
        note: note.trim() || undefined
      };

      const hasChanges = status !== ticket.status || note.trim() !== '';
      const newTimeline = hasChanges 
        ? [...ticket.timeline, newTimelineEvent]
        : ticket.timeline;

      const { data, error } = await supabase
        .from('reports')
        .update({
          status,
          priority,
          timeline: newTimeline,
        })
        .eq('id', ticket.id)
        .select()
        .single();

      if (error) throw error;
      
      setTicket(data as Ticket);
      setNote('');
      alert('อัปเดตข้อมูลสำเร็จ');
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งซ่อม ${ticket.ticket_id}?\nข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบและไม่สามารถกู้คืนได้`)) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', ticket.id);
      
      if (error) {
        toast.error('ลบข้อมูลไม่สำเร็จ: ' + error.message);
      } else {
        toast.success(`ลบรายการ ${ticket.ticket_id} สำเร็จ`);
        router.push('/admin/dashboard');
        router.refresh();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้าแรก
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 hidden md:block">จัดการแจ้งซ่อม: {ticket.ticket_id}</h1>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="shadow-sm">
            <Trash2 className="w-4 h-4 mr-2" /> ลบรายการนี้
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-cyan-600" /> ข้อมูลปัญหา
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">ประเภทปัญหา</p>
                  <p className="font-medium">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">ความสำคัญ</p>
                  <Badge variant="outline" className={PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG].color}>
                    {PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG].label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">รายละเอียด</p>
                <div className="bg-slate-50 p-4 rounded-md text-slate-700 whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
              
              {ticket.image_urls && ticket.image_urls.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">รูปภาพประกอบ</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`รูปภาพประกอบ ${i+1}`} className="w-32 h-32 object-cover rounded-md border border-slate-200 hover:opacity-80 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2 text-cyan-600" /> Timeline การทำงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                {ticket.timeline.map((event, index) => (
                  <div key={index} className="relative flex items-start group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-cyan-500 shrink-0 z-10">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="ml-4 bg-white p-4 rounded-lg border border-slate-200 w-full shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800">
                          {STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG]?.label || event.status}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString('th-TH')}</span>
                      </div>
                      {event.note && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">📝 {event.note}</p>}
                      <p className="text-xs text-slate-400 mt-2 text-right">โดย: {event.updatedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border-cyan-100 shadow-md">
            <CardHeader className="bg-cyan-50/50 border-b border-cyan-100">
              <CardTitle className="text-lg">จัดการสถานะงาน</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>ปรับสถานะ</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || status)}>
                  <SelectTrigger className={STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color + " text-white border-none"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>ปรับความสำคัญ</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val || priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>บันทึกการทำงาน (Note)</Label>
                <Textarea 
                  placeholder="เพิ่มบันทึก หรือสาเหตุที่เปลี่ยนสถานะ..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white" 
                onClick={handleUpdate}
                disabled={isSaving}
              >
                {isSaving ? 'กำลังบันทึก...' : <><Save className="w-4 h-4 mr-2" /> บันทึกข้อมูล</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-cyan-600" /> ข้อมูลผู้แจ้ง
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">ชื่อ - นามสกุล</p>
                <p className="font-medium">{ticket.first_name} {ticket.last_name} {ticket.nickname ? `(${ticket.nickname})` : ''}</p>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-slate-400" />
                <p className="font-medium">{ticket.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">ระดับชั้นปี</p>
                <p className="font-medium">{ticket.department}</p>
              </div>
              <div className="flex items-center pt-2 border-t">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">สถานที่เกิดเหตุ</p>
                  <p className="font-medium">อาคาร {ticket.building} ห้อง {ticket.room}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Ticket, STATUS_CONFIG, PRIORITY_CONFIG, TECHNICIANS } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Wrench, User, Phone, ArrowLeft, Save, Trash2, UserCheck, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
export default function TicketDetailView({ initialTicket }: { initialTicket: Ticket }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [status, setStatus] = useState<string>(initialTicket.status);
  const [priority, setPriority] = useState<string>(initialTicket.priority);
  const [assignedTo, setAssignedTo] = useState<string>(initialTicket.assigned_to || 'none');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const currentTech = TECHNICIANS.find(t => t.name === assignedTo || t.id === assignedTo);
  const handleUpdate = async (overrideStatus?: string) => {
    setIsSaving(true);
    const targetStatus = overrideStatus || status;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newTimelineEvents: any[] = [];
      const timestamp = new Date().toISOString();
      const updatedBy = user?.email || 'admin';
      const techChanged = (assignedTo !== (ticket.assigned_to || 'none'));
      const selectedTechObj = TECHNICIANS.find(t => t.id === assignedTo || t.name === assignedTo);
      if (techChanged) {
        if (selectedTechObj) {
          newTimelineEvents.push({
            status: targetStatus,
            timestamp,
            updatedBy,
            note: `มอบหมายงานให้ ${selectedTechObj.name} (โทร: ${selectedTechObj.phone})`
          });
        } else if (assignedTo === 'none' && ticket.assigned_to) {
          newTimelineEvents.push({
            status: targetStatus,
            timestamp,
            updatedBy,
            note: `ยกเลิกการมอบหมายช่าง`
          });
        }
      }
      const statusChanged = targetStatus !== ticket.status;
      const hasNote = note.trim() !== '';
      if (statusChanged || hasNote) {
        newTimelineEvents.push({
          status: targetStatus,
          timestamp: new Date().toISOString(),
          updatedBy,
          note: hasNote ? note.trim() : undefined
        });
      }
      const newTimeline = newTimelineEvents.length > 0
        ? [...ticket.timeline, ...newTimelineEvents]
        : ticket.timeline;
      const newAssignedValue = assignedTo === 'none' ? null : assignedTo;
      const payload: any = {
        status: targetStatus,
        priority,
        timeline: newTimeline,
        assigned_to: newAssignedValue,
      };
      let { data, error } = await supabase
        .from('reports')
        .update(payload)
        .eq('id', ticket.id)
        .select()
        .single();
      if (error && error.message.includes('uuid')) {
        delete payload.assigned_to;
        const retryResult = await supabase
          .from('reports')
          .update(payload)
          .eq('id', ticket.id)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }
      if (error) throw error;
      
      setTicket(data as Ticket);
      setStatus(targetStatus);
      setNote('');
      toast.success('อัปเดตข้อมูลงานแจ้งซ่อมสำเร็จ');
      router.refresh();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดต: ' + (error.message || ''));
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async () => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งซ่อม ${ticket.ticket_id}?`)) {
      const { error } = await supabase.from('reports').delete().eq('id', ticket.id);
      if (error) {
        toast.error('ลบข้อมูลไม่สำเร็จ: ' + error.message);
      } else {
        toast.success(`ลบรายการ ${ticket.ticket_id} สำเร็จ`);
        router.push('/admin/dashboard');
        router.refresh();
      }
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้ารวม
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 hidden md:block">
            จัดการงานแจ้งซ่อม: <span className="text-cyan-600">{ticket.ticket_id}</span>
          </h1>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="shadow-sm">
            <Trash2 className="w-4 h-4 mr-2" /> ลบรายการนี้
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-cyan-600" /> รายละเอียดปัญหา
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">หมวดหมู่งาน</p>
                  <p className="font-medium text-slate-800">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">ความเร่งด่วน</p>
                  <Badge variant="outline" className={PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]?.color}>
                    {PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]?.label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">รายละเอียด</p>
                <div className="bg-slate-50 p-4 rounded-md text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {ticket.description}
                </div>
              </div>
              
              {ticket.image_urls && ticket.image_urls.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">รูปภาพประกอบ ({ticket.image_urls.length} รูป)</p>
                  <div className="flex flex-wrap gap-3">
                    {ticket.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img 
                          src={url} 
                          alt={`รูปภาพประกอบ ${i + 1}`} 
                          className="w-32 h-32 object-cover rounded-lg border border-slate-200 hover:opacity-80 hover:scale-105 transition duration-200 shadow-sm" 
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2 text-cyan-600" /> ประวัติและ Timeline การดำเนินงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                {(ticket.timeline || []).map((event, index) => (
                  <div key={index} className="relative flex items-start group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-cyan-500 shrink-0 z-10 shadow-sm">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                    <div className="ml-4 bg-white p-4 rounded-lg border border-slate-200 w-full shadow-sm">
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                        <span className="font-bold text-slate-800">
                          {STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG]?.label || event.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleString('th-TH')}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                          📝 {event.note}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-2 text-right">
                        ดำเนินการโดย: <span className="font-medium text-slate-600">{event.updatedBy}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border-cyan-200 shadow-md">
            <CardHeader className="bg-cyan-50/70 border-b border-cyan-100">
              <CardTitle className="text-lg flex items-center text-cyan-900">
                <UserCheck className="w-5 h-5 mr-2 text-cyan-600" /> มอบหมายช่างซ่อม
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">เลือกช่างผู้รับผิดชอบงานนี้</Label>
                <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val)}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="เลือกช่างซ่อม..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- ยังไม่ได้มอบหมาย --</SelectItem>
                    {TECHNICIANS.map((tech) => (
                      <SelectItem key={tech.id} value={tech.name}>
                        {tech.name} (โทร {tech.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {currentTech ? (
                <div className="p-3.5 bg-cyan-50 rounded-xl border border-cyan-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-cyan-700 font-semibold uppercase tracking-wider">ช่างที่รับผิดชอบ</p>
                      <p className="text-base font-bold text-cyan-950 mt-0.5">{currentTech.name}</p>
                      <p className="text-xs text-cyan-700">{currentTech.role}</p>
                    </div>
                    <Badge className="bg-cyan-600 text-white hover:bg-cyan-600">มอบหมายแล้ว</Badge>
                  </div>
                  <div className="pt-2 border-t border-cyan-200/60 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{currentTech.phone}</span>
                    <a 
                      href={`tel:${currentTech.phone.replace(/[^0-9]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> โทรหาช่าง
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-500">ยังไม่มีช่างผู้รับผิดชอบงานนี้</p>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  📞 สมุดโทรศัพท์ช่างซ่อม
                </p>
                <div className="space-y-2">
                  {TECHNICIANS.map((tech) => (
                    <div 
                      key={tech.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{tech.name}</p>
                        <p className="text-xs text-slate-500">{tech.phone}</p>
                      </div>
                      <a
                        href={`tel:${tech.phone.replace(/[^0-9]/g, '')}`}
                        className="p-1.5 bg-white hover:bg-green-50 text-green-700 border border-green-200 rounded-md transition"
                        title={`โทรหา ${tech.name}`}
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">จัดการสถานะงาน</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 font-semibold uppercase">ทางลัดเปลี่ยนสถานะด่วน</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className={`text-xs ${status === 'acknowledged' ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' : ''}`}
                    onClick={() => setStatus('acknowledged')}
                  >
                    รับเรื่องแล้ว
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className={`text-xs ${status === 'in_progress' ? 'bg-purple-50 border-purple-400 text-purple-700 font-bold' : ''}`}
                    onClick={() => setStatus('in_progress')}
                  >
                    กำลังซ่อม
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className={`text-xs ${status === 'completed' ? 'bg-green-50 border-green-400 text-green-700 font-bold' : ''}`}
                    onClick={() => setStatus('completed')}
                  >
                    เสร็จสิ้น
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>เปลี่ยนสถานะ</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || status)}>
                  <SelectTrigger className={`${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color} text-white border-none`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>ความเร่งด่วน</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val || priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>บันทึกความคืบหน้า (Note)</Label>
                <Textarea 
                  placeholder="เช่น มอบหมายงานแล้ว, ส่งมอบอะไหล่เรียบร้อย..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 shadow-sm" 
                onClick={() => handleUpdate()}
                disabled={isSaving}
              >
                {isSaving ? 'กำลังบันทึกข้อมูล...' : <><Save className="w-4 h-4 mr-2" /> บันทึกการเปลี่ยนแปลง</>}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-cyan-600" /> ข้อมูลผู้แจ้ง
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">ชื่อ - นามสกุล</p>
                <p className="font-semibold text-slate-800">
                  {ticket.first_name} {ticket.last_name} {ticket.nickname ? `(${ticket.nickname})` : ''}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">เบอร์โทรศัพท์ผู้แจ้ง</p>
                  <p className="font-medium text-slate-800">{ticket.phone}</p>
                </div>
                <a
                  href={`tel:${ticket.phone.replace(/[^0-9]/g, '')}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> โทรหาผู้แจ้ง
                </a>
              </div>
              <div>
                <p className="text-sm text-slate-500">ระดับชั้น/แผนก</p>
                <p className="font-medium text-slate-800">{ticket.department}</p>
              </div>
              <div className="flex items-start pt-3 border-t border-slate-100">
                <MapPin className="w-4 h-4 mr-2 text-cyan-600 mt-1 shrink-0" />
                <div>
                  <p className="text-sm text-slate-500">สถานที่เกิดเหตุ</p>
                  <p className="font-semibold text-slate-800">อาคาร {ticket.building} ห้อง {ticket.room}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
