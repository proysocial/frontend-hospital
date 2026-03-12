import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Reporte } from '../../services/reporte/reporte';
import { Device } from '../../services/device';

@Component({
  selector: 'app-dashboard-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule, MatIconModule],
  templateUrl: './dashboard-reportes.html',
  styleUrl: './dashboard-reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardReportes implements OnInit {
  private device     = inject(Device);
  private svc        = inject(Reporte);
  private cdr        = inject(ChangeDetectorRef);
  private router     = inject(Router);

  isHandset$ = this.device.isHandset$;
  isDesktop$ = this.device.isDesktop$;

  // ── estado ──────────────────────────────────────────────────────
  loading   = true;
  rawData: any = null;

  // ── filtros ─────────────────────────────────────────────────────
  areaActiva: string | null = null;
  fechaInicio = '';
  fechaFin    = '';
  areas: { arealab: string; total: number }[] = [];

  // ── KPIs globales ────────────────────────────────────────────────
  totalSolicitados  = 0;
  totalConResultado = 0;
  tasaResultado     = 0;
  totalFemenino     = 0;
  totalMasculino    = 0;
  examenTop         = '';

  // ── KPIs de área ─────────────────────────────────────────────────
  areaSolicitados  = 0;
  areaConResultado = 0;
  areaTasa         = 0;
  areaExamenTop    = '';

  // ── Gráficos GLOBALES ────────────────────────────────────────────
  examenesChart: any;
  sexoChart: any;
  edadChart: any;
  serviciosChart: any;
  tendenciaChart: any;
  horasChart: any;
  seguroChart: any;
  sedeChart: any;
  doctoresChart: any;
  cie10Chart: any;
  trazabilidadChart: any;
  normalPatChart: any;
  // ── Nuevos Gráficos GLOBALES ────────────────────────────────────────────
  diaSemanaChart: any;
  pacientesChart: any;
  paretoCie10Chart: any;
  curvaHorasChart: any;
  segurosRoseChart: any;
  sedesTreemapChart: any;

  // ── Gráficos POR ÁREA ────────────────────────────────────────────
  areaTopExamenesChart: any;
  areaServiciosChart: any;
  areaResultadoDonutChart: any;
  areaCIE10Chart: any;
  areaTendenciaChart: any;
  areaSexoChart: any;
  areaGaugeChart: any;
  // Trazabilidad profunda: examen → resultado
  areaExamenResultadoChart: any;
  // Doctor → examen más solicitado
  areaDoctorChart: any;
  // Nuevas métricas por área
  areaDiaSemanaChart: any;
  areaPacientesChart: any;
  areaRadarSemanalChart: any;

  private readonly C = [
    '#1D6FD8','#10B981','#F59E0B','#EF4444','#8B5CF6',
    '#06B6D4','#F97316','#84CC16','#EC4899','#14B8A6',
  ];

  ngOnInit() { this.cargar(); }

  volver() { this.router.navigate(['principal/reportes/nuevo']); }

  // ── carga ────────────────────────────────────────────────────────
  cargar() {
    this.loading = true;
    const f: any = {};
    if (this.areaActiva)  f['area']         = this.areaActiva;
    if (this.fechaInicio) f['fecha_inicio']  = this.fechaInicio;
    if (this.fechaFin)    f['fecha_fin']     = this.fechaFin;

    this.svc.obtenerMetricas(f).subscribe({
      next: (data) => {
        this.rawData = data;
        // Tabs: siempre todos los servicios que devuelve el backend
        if (data.areas?.length > 0) this.areas = data.areas;
        this.procesarKPIs(data);
        if (!this.areaActiva) {
          this.buildGlobales(data);
        } else {
          this.buildArea(data);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las métricas' });
      },
    });
  }

  seleccionarArea(area: string | null) {
    this.areaActiva = area;
    this.cargar();
  }

  limpiarFiltros() {
    this.fechaInicio = '';
    this.fechaFin    = '';
    this.areaActiva  = null;
    this.cargar();
  }

  // ── KPIs ─────────────────────────────────────────────────────────
  procesarKPIs(data: any) {
    const k = data.kpis ?? {};
    this.totalSolicitados  = k.total_solicitados  ?? 0;
    this.totalConResultado = k.total_con_resultado ?? 0;
    this.tasaResultado     = k.tasa_resultado      ?? 0;
    this.examenTop         = k.examen_top          ?? '-';
    const sx: any[]        = data.pacientes_por_sexo ?? [];
    this.totalFemenino  = sx.find((s:any) => s.sexo === 'F')?.total ?? 0;
    this.totalMasculino = sx.find((s:any) => s.sexo === 'M')?.total ?? 0;

    if (this.areaActiva && data.resumen_por_area?.[this.areaActiva]) {
      const a = data.resumen_por_area[this.areaActiva];
      this.areaSolicitados  = a.total_solicitados  ?? 0;
      this.areaConResultado = a.total_con_resultado ?? 0;
      this.areaTasa = this.areaSolicitados > 0
        ? Math.round((this.areaConResultado / this.areaSolicitados) * 100) : 0;
      this.areaExamenTop = a.top_examenes?.[0]?.desc_examen ?? '-';
    }
  }

  get datosArea(): any {
    if (!this.areaActiva || !this.rawData?.resumen_por_area) return null;
    return this.rawData.resumen_por_area[this.areaActiva] ?? null;
  }

  fmt(n: number)           { return (n ?? 0).toLocaleString('es-PE'); }
  tr(s: string, n = 35)    { return s?.length > n ? s.slice(0,n)+'…' : (s ?? ''); }
  trMed(s: string, n = 22) { return s?.length > n ? s.slice(0,n)+'…' : (s ?? ''); }
  color(i: number)         { return this.C[i % this.C.length]; }

  iconArea(a: string) {
    const m: Record<string,string> = {
      'RADIOLOGIA DIAGNOSTICA':'radiology',
      'ULTRASONIDO DIAGNOSTICO':'sensors',
      'MAMOGRAFIA':'monitor_heart',
      'ESTUDIOS DIAGNOSTICOS VASCULARES NO INVASIVOS':'favorite',
      'MEDICINA NUCLEAR':'science',
      'ESTUDIOS OSEOS / ARTICULACIONES':'accessibility_new',
    };
    return m[a] ?? 'biotech';
  }

  // ════════════════════════════════════════════════════════════════
  //  GRÁFICOS GLOBALES
  // ════════════════════════════════════════════════════════════════
  buildGlobales(d: any) {
    this.gExamenes(d);
    this.gSexo(d);
    this.gEdad(d);
    this.gServicios(d);
    this.gTendencia(d);
    this.gHoras(d);
    this.gSeguro(d);
    this.gSedes(d);
    this.gDoctores(d);
    this.gCIE10(d);
    this.gTrazabilidad(d);
    this.gNormalPat(d);
    // Nuevos gráficos globales
    this.gDiaSemana(d);
    this.gPacientes(d);
    this.gParetoCie10(d);
    this.gCurvaHoras(d);
    this.gSegurosRose(d);
    this.gSedesTreemap(d);
  }

  private hBar(data: any[], key: string, color: string, truncN = 35) {
    return {
      tooltip: { trigger:'axis', axisPointer:{type:'shadow'} },
      grid: { left:8, right:55, bottom:8, top:8, containLabel:true },
      xAxis: { type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}} },
      yAxis: {
        type:'category',
        data: [...data].reverse().map((e:any) => this.tr(e[key], truncN)),
        axisLabel:{ fontSize:11, color:'#475569' },
        axisLine:{show:false}, axisTick:{show:false},
      },
      series:[{
        type:'bar', barMaxWidth:26,
        data: [...data].reverse().map((e:any) => e.total),
        itemStyle:{ color, borderRadius:[0,6,6,0] },
        label:{ show:true, position:'right', fontSize:11, color:'#334155' },
      }],
    };
  }

  private gExamenes(d: any) {
    this.examenesChart = this.hBar((d.examenes_mas_solicitados ?? []).slice(0,10), 'desc_examen', '#1D6FD8');
  }

  private gServicios(d: any) {
    this.serviciosChart = this.hBar((d.servicios_mas_demanda ?? []).slice(0,10), 'servicio', '#10B981', 30);
  }

  private gDoctores(d: any) {
    const data = (d.doctores_top ?? []).slice(0,10);
    this.doctoresChart = {
      tooltip:{ trigger:'axis', axisPointer:{type:'shadow'} },
      grid:{ left:8, right:55, bottom:8, top:8, containLabel:true },
      xAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}} },
      yAxis:{
        type:'category',
        data: [...data].reverse().map((x:any) => {
          const p = x.profesional?.split(' ') ?? [];
          return p.length >= 2 ? `${p[0]} ${p[1]}` : x.profesional;
        }),
        axisLabel:{fontSize:11, color:'#475569'},
        axisLine:{show:false}, axisTick:{show:false},
      },
      series:[{
        type:'bar', barMaxWidth:26,
        data:[...data].reverse().map((x:any) => x.total),
        itemStyle:{ color:'#8B5CF6', borderRadius:[0,6,6,0] },
        label:{show:true, position:'right', fontSize:11, color:'#334155'},
      }],
    };
  }

  private gSexo(d: any) {
    const sx: any[] = d.pacientes_por_sexo ?? [];
    this.sexoChart = {
      tooltip:{ trigger:'item', formatter:'{b}: {c} ({d}%)' },
      legend:{ bottom:4, textStyle:{fontSize:12, color:'#475569'} },
      series:[{
        type:'pie', radius:['48%','72%'],
        label:{show:false}, labelLine:{show:false},
        data: sx.map((s:any, i:number) => ({
          name: s.sexo==='F'?'Femenino': s.sexo==='M'?'Masculino': s.sexo,
          value: s.total,
          itemStyle:{ color: i===0 ? '#EC4899' : '#1D6FD8' },
        })),
        emphasis:{itemStyle:{shadowBlur:10, shadowColor:'rgba(0,0,0,0.15)'}},
      }],
    };
  }

  private gEdad(d: any) {
    const ed: any[] = d.distribucion_edad ?? [];
    this.edadChart = {
      tooltip:{ trigger:'axis', axisPointer:{type:'shadow'} },
      grid:{ left:8, right:12, bottom:8, top:8, containLabel:true },
      xAxis:{ type:'category', data:ed.map((e:any)=>e.rango),
        axisLabel:{fontSize:11, color:'#475569'}, axisLine:{lineStyle:{color:'#e2e8f0'}} },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'} },
      series:[{
        type:'bar', barMaxWidth:38,
        data: ed.map((e:any, i:number) => ({
          value: e.total,
          itemStyle:{ color:this.color(i), borderRadius:[4,4,0,0] },
        })),
        label:{show:true, position:'top', fontSize:11, color:'#475569'},
      }],
    };
  }

  private gTendencia(d: any) {
    const t: any[] = d.tendencia_mensual ?? [];
    this.tendenciaChart = {
      tooltip:{ trigger:'axis' },
      grid:{ left:8, right:12, bottom:8, top:16, containLabel:true },
      xAxis:{ type:'category', data:t.map((x:any)=>x.mes),
        axisLabel:{rotate:30, fontSize:11, color:'#475569'} },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'} },
      series:[{
        type:'line', smooth:true, symbol:'circle', symbolSize:7,
        data:t.map((x:any)=>x.total),
        lineStyle:{ color:'#8B5CF6', width:3 },
        itemStyle:{ color:'#8B5CF6' },
        areaStyle:{ color:{type:'linear',x:0,y:0,x2:0,y2:1,
          colorStops:[{offset:0,color:'rgba(139,92,246,0.22)'},{offset:1,color:'rgba(139,92,246,0.02)'}]} },
        label:{ show:t.length<=6, position:'top', fontSize:12, fontWeight:'bold', color:'#8B5CF6' },
      }],
    };
  }

  private gHoras(d: any) {
    const raw: any[] = d.horas_pico ?? [];
    const agr: Record<string,number> = {};
    for (const h of raw) {
      const k = (h.horsolic ?? '').substring(0,2)+':00';
      agr[k] = (agr[k]??0) + (h.total??0);
    }
    const sorted = Object.entries(agr).sort(([a],[b])=>a.localeCompare(b));
    this.horasChart = {
      tooltip:{ trigger:'axis' },
      grid:{ left:8, right:12, bottom:8, top:8, containLabel:true },
      xAxis:{ type:'category', data:sorted.map(([h])=>h),
        axisLabel:{rotate:45, fontSize:10, color:'#475569'} },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'} },
      series:[{
        type:'bar', barMaxWidth:30,
        data:sorted.map(([,v])=>v),
        itemStyle:{ color:'#F59E0B', borderRadius:[4,4,0,0] },
        label:{show:true, position:'top', fontSize:10, color:'#475569'},
      }],
    };
  }

  private gSeguro(d: any) {
    const sg: any[] = d.seguro_uso ?? [];
    this.seguroChart = {
      tooltip:{ trigger:'item', formatter:'{b}: {c} ({d}%)' },
      legend:{ orient:'vertical', left:4, top:'center', textStyle:{fontSize:10, color:'#475569'} },
      series:[{
        type:'pie', radius:['35%','62%'], center:['65%','50%'],
        label:{show:false},
        data: sg.map((s:any, i:number) => ({
          name: this.tr(s.tipo_seguro?.trim()??'', 24),
          value: s.total,
          itemStyle:{ color:this.color(i) },
        })),
      }],
    };
  }

  private gSedes(d: any) {
    const sd: any[] = (d.sedes ?? []).filter((s:any) => s.sede?.trim());
    this.sedeChart = this.hBar(sd, 'sede', '#F97316', 26);
  }

  private gCIE10(d: any) {
    const data = (d.diagnosticos_cie10 ?? []).slice(0,12);
    this.cie10Chart = {
      tooltip:{ trigger:'axis',
        formatter:(p:any) => {
          const item = data[data.length-1-p[0].dataIndex];
          return `<b>${item?.diagnostico}</b><br/>${this.tr(item?.des_diagn??'',55)}<br/>Total: <b>${p[0].value}</b>`;
        },
      },
      grid:{ left:8, right:55, bottom:8, top:8, containLabel:true },
      xAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}} },
      yAxis:{
        type:'category',
        data:[...data].reverse().map((c:any)=>c.diagnostico),
        axisLabel:{fontSize:11, fontWeight:600, color:'#475569'},
        axisLine:{show:false}, axisTick:{show:false},
      },
      series:[{
        type:'bar', barMaxWidth:26,
        data:[...data].reverse().map((c:any)=>c.total),
        itemStyle:{ color:'#F59E0B', borderRadius:[0,6,6,0] },
        label:{show:true, position:'right', fontSize:11, color:'#334155'},
      }],
    };
  }

  private gTrazabilidad(d: any) {
    const sol = d.kpis?.total_solicitados  ?? 0;
    const res = d.kpis?.total_con_resultado ?? 0;
    this.trazabilidadChart = {
      tooltip:{ trigger:'item', formatter:'{b}: {c} ({d}%)' },
      legend:{ bottom:4, textStyle:{color:'#475569', fontSize:12} },
      series:[{
        type:'pie', radius:['42%','68%'],
        label:{show:true, formatter:'{b}\n{d}%', fontSize:11},
        data:[
          {name:'Con resultado',    value:res,                     itemStyle:{color:'#10B981'}},
          {name:'Sin resultado aún',value:Math.max(0,sol-res),     itemStyle:{color:'#e2e8f0'}},
        ],
      }],
    };
  }

  private gNormalPat(d: any) {
    const data = (d.normal_patologico ?? []).filter((x:any) => !['TOTAL','',null].includes(x.resultado));
    this.normalPatChart = {
      tooltip:{ trigger:'item', formatter:'{b}: {c} ({d}%)' },
      legend:{ bottom:4, textStyle:{color:'#475569', fontSize:12} },
      series:[{
        type:'pie', radius:['45%','70%'],
        label:{show:data.length>0},
        data: data.length>0
          ? data.map((x:any) => ({
              name:x.resultado, value:x.total,
              itemStyle:{ color:x.resultado==='NORMAL'?'#10B981':'#EF4444' },
            }))
          : [{name:'Sin clasificar', value:1, itemStyle:{color:'#e2e8f0'}}],
      }],
    };
  }

  // -- NUEVOS GRAFICOS GLOBALES --
  private gDiaSemana(d: any) {
    const raw = d.demanda_dia_semana ?? [];
    const mapDias: Record<number, string> = {1:'Dom', 2:'Lun', 3:'Mar', 4:'Mié', 5:'Jue', 6:'Vie', 7:'Sáb'};
    
    const dataObj: Record<string, number> = {'Lun':0, 'Mar':0, 'Mié':0, 'Jue':0, 'Vie':0, 'Sáb':0, 'Dom':0};
    raw.forEach((item: any) => {
      if(mapDias[item.dia_semana]) dataObj[mapDias[item.dia_semana]] = item.total;
    });

    const orden = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    this.diaSemanaChart = {
      tooltip:{ trigger:'axis', axisPointer:{type:'shadow'} },
      grid:{ left:8, right:12, bottom:8, top:8, containLabel:true },
      xAxis:{ type:'category', data:orden, axisLabel:{fontSize:11, color:'#475569'} },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'} },
      series:[{
        type:'bar', barMaxWidth:30,
        data: orden.map(dia => dataObj[dia]),
        itemStyle:{ color:'#14B8A6', borderRadius:[4,4,0,0] },
        label:{show:true, position:'top', fontSize:11, color:'#475569'},
      }],
    };
  }

  private gPacientes(d: any) {
    const data = (d.pacientes_frecuentes ?? []).slice(0, 10);
    this.pacientesChart = this.hBar(data, 'paciente', '#F59E0B', 25);
  }

  private gParetoCie10(d: any) {
    const data = (d.diagnosticos_cie10 ?? []).slice(0, 10);
    const totalGeneral = data.reduce((sum: number, item: any) => sum + item.total, 0);
    
    let acumulado = 0;
    const porcentajes = data.map((item: any) => {
      acumulado += item.total;
      return Number(((acumulado / totalGeneral) * 100).toFixed(1));
    });

    this.paretoCie10Chart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: 8, right: 40, bottom: 8, top: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((c: any) => c.diagnostico),
        axisLabel: { fontSize: 10, color: '#475569' }
      },
      yAxis: [
        { type: 'value', name: 'Volumen', splitLine: { lineStyle: { color: '#f1f5f9' } } },
        { type: 'value', name: '% Acumulado', min: 0, max: 100, axisLabel: { formatter: '{value} %' } }
      ],
      series: [
        {
          name: 'Volumen',
          type: 'bar',
          data: data.map((c: any) => c.total),
          itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '% Acumulado',
          type: 'line',
          yAxisIndex: 1,
          data: porcentajes,
          itemStyle: { color: '#EF4444' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    };
  }

  private gCurvaHoras(d: any) {
    const horasOrdenadas = [...(d.horas_pico ?? [])].sort((a, b) => 
      (a.horsolic > b.horsolic) ? 1 : ((b.horsolic > a.horsolic) ? -1 : 0)
    );

    this.curvaHorasChart = {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 15, bottom: 8, top: 15, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: horasOrdenadas.map((h: any) => h.horsolic),
        axisLabel: { fontSize: 10, color: '#475569' }
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [{
        name: 'Solicitudes',
        type: 'line',
        smooth: true,
        data: horasOrdenadas.map((h: any) => h.total),
        itemStyle: { color: '#F59E0B' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(245, 158, 11, 0.5)' }, { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }]
          }
        }
      }]
    };
  }

  private gSegurosRose(d: any) {
    const sg = d.seguro_uso ?? [];
    this.segurosRoseChart = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} pacientes ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 10, color: '#475569' } },
      series: [
        {
          name: 'Seguro',
          type: 'pie',
          radius: [20, 100],
          center: ['50%', '45%'],
          roseType: 'area',
          itemStyle: { borderRadius: 4 },
          data: sg.map((s: any, i: number) => ({
            name: this.tr(s.tipo_seguro?.trim() ?? '', 15),
            value: s.total,
            itemStyle: { color: this.color(i) }
          }))
        }
      ]
    };
  }

  private gSedesTreemap(d: any) {
    const sd = (d.sedes ?? []).filter((s: any) => s.sede?.trim());
    this.sedesTreemapChart = {
      tooltip: { formatter: '{b}: <b>{c}</b> atenciones' },
      series: [{
        type: 'treemap',
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
        data: sd.map((s: any, i: number) => ({
          name: s.sede,
          value: s.total,
          itemStyle: { color: this.color(i) }
        }))
      }]
    };
  }

  // ════════════════════════════════════════════════════════════════
  //  GRÁFICOS POR ÁREA
  // ════════════════════════════════════════════════════════════════
  buildArea(d: any) {
    const a = d.resumen_por_area?.[this.areaActiva!];
    if (!a) return;

    // 1. Gauge tasa cobertura
    const tasa = this.areaTasa;
    this.areaGaugeChart = {
      series:[{
        type:'gauge', center:['50%','58%'], radius:'88%',
        startAngle:200, endAngle:-20, min:0, max:100, splitNumber:5,
        axisLine:{lineStyle:{width:22, color:[[tasa/100,'#10B981'],[1,'#f1f5f9']]}},
        pointer:{itemStyle:{color:'#10B981'}},
        axisTick:{show:false}, splitLine:{show:false}, axisLabel:{show:false},
        title:{offsetCenter:['0%','32%'], fontSize:11, color:'#94a3b8'},
        detail:{
          valueAnimation:true, fontSize:30, fontWeight:700,
          color: tasa>=70?'#10B981': tasa>=40?'#F59E0B':'#EF4444',
          formatter:'{value}%', offsetCenter:['0%','-8%'],
        },
        data:[{value:tasa, name:`${this.areaConResultado} de ${this.areaSolicitados} con resultado`}],
      }],
    };

    // 2. Normal vs Patológico
    const resDist = (a.resultado_distribucion ?? []).filter((x:any)=>!['TOTAL','',null].includes(x.resultado));
    this.areaResultadoDonutChart = {
      tooltip:{trigger:'item', formatter:'{b}: {c} ({d}%)'},
      legend:{bottom:4, textStyle:{color:'#475569', fontSize:12}},
      series:[{
        type:'pie', radius:['45%','70%'],
        data: resDist.length>0
          ? resDist.map((x:any)=>({
              name:x.resultado, value:x.total,
              itemStyle:{color:x.resultado==='NORMAL'?'#10B981':'#EF4444'},
            }))
          : [{name:'Sin clasificar', value:1, itemStyle:{color:'#e2e8f0'}}],
      }],
    };

    // 3. Top exámenes del área
    this.areaTopExamenesChart = this.hBar((a.top_examenes??[]).slice(0,8), 'desc_examen', '#1D6FD8', 40);

    // 4. Servicios que solicitan al área
    this.areaServiciosChart = this.hBar((a.servicios??[]).slice(0,8), 'servicio', '#10B981', 30);

    // 5. CIE-10 del área
    const cie10 = (a.cie10 ?? []).slice(0,10);
    this.areaCIE10Chart = {
      tooltip:{ trigger:'axis',
        formatter:(p:any) => {
          const item = cie10[cie10.length-1-p[0].dataIndex];
          return `<b>${item?.diagnostico}</b><br/>${this.tr(item?.des_diagn??'',55)}<br/>Total: <b>${p[0].value}</b>`;
        },
      },
      grid:{left:8, right:55, bottom:8, top:8, containLabel:true},
      xAxis:{type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}},
      yAxis:{
        type:'category',
        data:[...cie10].reverse().map((c:any)=>c.diagnostico),
        axisLabel:{fontSize:11, fontWeight:600, color:'#475569'},
        axisLine:{show:false}, axisTick:{show:false},
      },
      series:[{
        type:'bar', barMaxWidth:26,
        data:[...cie10].reverse().map((c:any)=>c.total),
        itemStyle:{color:'#F59E0B', borderRadius:[0,6,6,0]},
        label:{show:true, position:'right', fontSize:11, color:'#334155'},
      }],
    };

    // 6. Tendencia del área
    const tend: any[] = a.tendencia ?? [];
    this.areaTendenciaChart = {
      tooltip:{trigger:'axis'},
      grid:{left:8, right:12, bottom:8, top:16, containLabel:true},
      xAxis:{type:'category', data:tend.map((t:any)=>t.mes),
        axisLabel:{rotate:30, fontSize:11, color:'#475569'}},
      yAxis:{type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'}},
      series:[{
        type:'line', smooth:true, symbol:'circle', symbolSize:7,
        data:tend.map((t:any)=>t.total),
        lineStyle:{color:'#8B5CF6', width:3},
        itemStyle:{color:'#8B5CF6'},
        areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,
          colorStops:[{offset:0,color:'rgba(139,92,246,0.22)'},{offset:1,color:'rgba(139,92,246,0.02)'}]}},
        label:{show:true, position:'top', fontSize:12, fontWeight:'bold', color:'#8B5CF6'},
      }],
    };

    // 7. Sexo en el área
    const sexoArea: any[] = a.sexo ?? [];
    this.areaSexoChart = {
      tooltip:{trigger:'item', formatter:'{b}: {c} ({d}%)'},
      legend:{bottom:4, textStyle:{fontSize:12, color:'#475569'}},
      series:[{
        type:'pie', radius:['45%','70%'],
        label:{show:false}, labelLine:{show:false},
        data: sexoArea.map((s:any, i:number) => ({
          name:s.sexo==='F'?'Femenino':s.sexo==='M'?'Masculino':s.sexo,
          value:s.total,
          itemStyle:{color:i===0?'#EC4899':'#1D6FD8'},
        })),
      }],
    };

    // 8. Trazabilidad: examen → tiene resultado? (bubble/scatter simulado con stacked bar)
    const examTop = (a.top_examenes ?? []).slice(0, 6);
    const totalArea = a.total_solicitados ?? 1;
    this.areaExamenResultadoChart = {
      tooltip:{ trigger:'axis', axisPointer:{type:'shadow'},
        formatter:(params:any) => {
          const items = params.map((p:any)=>`${p.marker}${p.seriesName}: <b>${p.value}</b>`).join('<br/>');
          return `${params[0]?.name}<br/>${items}`;
        },
      },
      legend:{bottom:2, textStyle:{fontSize:11, color:'#475569'}},
      grid:{left:8, right:8, bottom:40, top:16, containLabel:true},
      xAxis:{
        type:'category',
        data:examTop.map((e:any)=>this.trMed(e.desc_examen, 20)),
        axisLabel:{rotate:25, fontSize:10, color:'#475569'},
      },
      yAxis:{type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'}},
      series:[
        {
          name:'Solicitados',
          type:'bar', stack:'total', barMaxWidth:40,
          data:examTop.map((e:any)=>e.total),
          itemStyle:{color:'#1D6FD8', borderRadius:[0,0,0,0]},
        },
        {
          name:'Con resultado (estimado)',
          type:'bar', stack:'total', barMaxWidth:40,
          data:examTop.map((e:any)=>Math.round(e.total * (a.total_con_resultado/Math.max(totalArea,1)))),
          itemStyle:{color:'#10B981'},
          label:{show:true, position:'top', fontSize:10, color:'#334155',
            formatter:(p:any)=>p.value > 0 ? p.value : ''},
        },
      ],
    };

    // 9. Doctor que más solicita en el área (usando doctores globales filtrados por área)
    const docsGlobal = (this.rawData?.doctores_top ?? []).slice(0,8);
    this.areaDoctorChart = {
      tooltip:{trigger:'axis', axisPointer:{type:'shadow'}},
      grid:{left:8, right:55, bottom:8, top:8, containLabel:true},
      xAxis:{type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}},
      yAxis:{
        type:'category',
        data:[...docsGlobal].reverse().map((x:any)=>{
          const p = x.profesional?.split(' ') ?? [];
          return p.length>=2?`${p[0]} ${p[1]}`:x.profesional;
        }),
        axisLabel:{fontSize:11, color:'#475569'},
        axisLine:{show:false}, axisTick:{show:false},
      },
      series:[{
        type:'bar', barMaxWidth:26,
        data:[...docsGlobal].reverse().map((x:any)=>x.total),
        itemStyle:{color:'#EC4899', borderRadius:[0,6,6,0]},
        label:{show:true, position:'right', fontSize:11, color:'#334155'},
      }],
    };

    // -- NUEVOS GRAFICOS POR AREA --
    this.gAreaDiaSemana(a);
    this.gAreaPacientes(a);
    this.gAreaTendenciaResultados(a);
    this.gAreaRadarSemanal(a);
  }

  // NUEVOS GRÁFICOS POR ÁREAS
  private gAreaDiaSemana(a: any) {
    const raw = a.dia_semana ?? [];
    const mapDias: Record<number, string> = {1:'Dom', 2:'Lun', 3:'Mar', 4:'Mié', 5:'Jue', 6:'Vie', 7:'Sáb'};
    const dataObj: Record<string, number> = {'Lun':0, 'Mar':0, 'Mié':0, 'Jue':0, 'Vie':0, 'Sáb':0, 'Dom':0};
    
    raw.forEach((item: any) => {
      if(mapDias[item.dia_semana]) dataObj[mapDias[item.dia_semana]] = item.total;
    });

    const orden = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    this.areaDiaSemanaChart = {
      tooltip:{ trigger:'axis', axisPointer:{type:'shadow'} },
      grid:{ left:8, right:12, bottom:8, top:8, containLabel:true },
      xAxis:{ type:'category', data:orden, axisLabel:{fontSize:11, color:'#475569'} },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:'#f1f5f9'}}, axisLabel:{color:'#94a3b8'} },
      series:[{
        type:'bar', barMaxWidth:30,
        data: orden.map(dia => dataObj[dia]),
        itemStyle:{ color:'#14B8A6', borderRadius:[4,4,0,0] },
        label:{show:true, position:'top', fontSize:11, color:'#475569'},
      }],
    };
  }

  private gAreaPacientes(a: any) {
    const data = (a.pacientes_frecuentes ?? []).slice(0, 10);
    this.areaPacientesChart = this.hBar(data, 'paciente', '#F59E0B', 25);
  }

  private gAreaTendenciaResultados(a: any) {
    const raw = a.tendencia_resultados ?? [];
    const mesesSet = new Set<string>();
    const seriesObj: Record<string, Record<string, number>> = {};
    
    raw.forEach((item: any) => {
      mesesSet.add(item.mes);
      if(!seriesObj[item.resultado]) seriesObj[item.resultado] = {};
      seriesObj[item.resultado][item.mes] = item.total;
    });

    const meses = Array.from(mesesSet).sort();
    const resultadosKeys = Object.keys(seriesObj);
  }

  private gAreaRadarSemanal(a: any) {
    const raw = a.dia_semana ?? [];
    // 1:Dom, 2:Lun, 3:Mar, 4:Mié, 5:Jue, 6:Vie, 7:Sáb
    const mapDias: Record<number, string> = { 2:'Lunes', 3:'Martes', 4:'Miércoles', 5:'Jueves', 6:'Viernes', 7:'Sábado', 1:'Domingo' };
    const dataObj: Record<string, number> = { 'Lunes':0, 'Martes':0, 'Miércoles':0, 'Jueves':0, 'Viernes':0, 'Sábado':0, 'Domingo':0 };
    
    raw.forEach((item: any) => {
      if(mapDias[item.dia_semana]) dataObj[mapDias[item.dia_semana]] = item.total;
    });

    const maxVal = Math.max(...Object.values(dataObj), 10);

    this.areaRadarSemanalChart = {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: [
          { name: 'Lun', max: maxVal }, { name: 'Mar', max: maxVal },
          { name: 'Mié', max: maxVal }, { name: 'Jue', max: maxVal },
          { name: 'Vie', max: maxVal }, { name: 'Sáb', max: maxVal }, { name: 'Dom', max: maxVal }
        ],
        axisName: { color: '#475569', fontWeight: 'bold' },
        splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9'] } }
      },
      series: [{
        name: 'Atenciones',
        type: 'radar',
        data: [{
          value: [dataObj['Lunes'], dataObj['Martes'], dataObj['Miércoles'], dataObj['Jueves'], dataObj['Viernes'], dataObj['Sábado'], dataObj['Domingo']],
          name: 'Volumen',
          areaStyle: { color: 'rgba(16, 185, 129, 0.4)' },
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' }
        }]
      }]
    };
  }
  

}