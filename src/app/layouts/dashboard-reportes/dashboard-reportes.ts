import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reporte } from '../../services/reporte/reporte';
import { NgxEchartsModule } from 'ngx-echarts';
import Swal from 'sweetalert2';
import { Device } from '../../services/device';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-reportes',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, MatIconModule],
  templateUrl: './dashboard-reportes.html',
  styleUrl: './dashboard-reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardReportes implements OnInit {
  private device = inject(Device);
  private reporteService = inject(Reporte);
  private cdr = inject(ChangeDetectorRef); // ← NECESARIO para OnPush
  private router = inject(Router)

  isHandset$ = this.device.isHandset$;
  isTablet$ = this.device.isTablet$;
  isDesktop$ = this.device.isDesktop$;

  loading = true;

  // KPIs
  totalPacientes = 0;
  totalFemenino = 0;
  totalMasculino = 0;
  examenTop = '';
  servicioTop = '';

  // Gráficos
  examenesChart: any;
  sexoChart: any;
  serviciosChart: any;
  horasChart: any;
  tendenciaChart: any;
  edadChart: any;
  seguroChart: any;
  areaChart: any;
  doctoresChart: any;
  sedeChart: any;

  ngOnInit(): void {
    this.cargarMetricas();
  }

  volver() {
    this.router.navigate(['principal/reportes/nuevo']);
  }

  cargarMetricas() {
    this.reporteService.obtenerMetricas().subscribe({
      next: (data) => {
        this.procesarKPIs(data);
        this.crearGraficos(data);
        this.loading = false;
        this.cdr.markForCheck(); // ← necesario con OnPush

        Swal.fire({
          icon: 'success',
          title: 'Reporte generado',
          text: 'Los gráficos se cargaron correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las métricas'
        });
      }
    });
  }

  procesarKPIs(data: any) {
    const sexos: any[] = data.pacientes_por_sexo ?? [];
    this.totalPacientes = sexos.reduce((acc: number, s: any) => acc + s.total, 0);
    this.totalFemenino = sexos.find((s: any) => s.sexo === 'F')?.total ?? 0;
    this.totalMasculino = sexos.find((s: any) => s.sexo === 'M')?.total ?? 0;
    this.examenTop = data.examenes_mas_solicitados?.[0]?.desc_examen ?? '-';
    this.servicioTop = data.servicios_mas_demanda?.[0]?.servicio ?? '-';
  }

  crearGraficos(data: any) {

    // ── Paleta compartida ──────────────────────────────────────────────────
    const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
                    '#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6'];

    // 1. Exámenes más solicitados (Bar horizontal)
    const examenes: any[] = data.examenes_mas_solicitados ?? [];
    this.examenesChart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: [...examenes].reverse().map((e: any) =>
          e.desc_examen.length > 35
            ? e.desc_examen.substring(0, 35) + '…'
            : e.desc_examen
        ),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: [...examenes].reverse().map((e: any) => e.total),
        itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', fontSize: 11 }
      }]
    };

    // 2. Pacientes por sexo (Donut)
    const sexo: any[] = data.pacientes_por_sexo ?? [];
    this.sexoChart = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}\n{c} ({d}%)' },
        data: sexo.map((p: any, i: number) => ({
          name: p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : p.sexo,
          value: p.total,
          itemStyle: { color: COLORS[i] }
        }))
      }]
    };

    // 3. Servicios con mayor demanda (Bar horizontal — ojo: clave correcta)
    const servicios: any[] = (data.servicios_mas_demanda ?? []).slice(0, 12);
    this.serviciosChart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '6%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: [...servicios].reverse().map((s: any) => s.servicio),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: [...servicios].reverse().map((s: any) => s.total),
        itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', fontSize: 11 }
      }]
    };

    // 4. Horas pico — agrupado por hora (sin minutos) para línea legible
    const horasRaw: any[] = data.horas_pico ?? [];
    const horasAgrupadas: Record<string, number> = {};
    for (const h of horasRaw) {
      const hora = h.hora_solicitud.substring(0, 2) + ':00'; // ← clave correcta
      horasAgrupadas[hora] = (horasAgrupadas[hora] ?? 0) + h.total;
    }
    const horasOrdenadas = Object.entries(horasAgrupadas).sort(([a], [b]) => a.localeCompare(b));
    this.horasChart = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: horasOrdenadas.map(([h]) => h),
        axisLabel: { rotate: 45, fontSize: 11 }
      },
      yAxis: { type: 'value' },
      series: [{
        data: horasOrdenadas.map(([, v]) => v),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3, color: '#f59e0b' },
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' }
      }]
    };

    // 5. Tendencia por fecha (Line)
    const tendencia: any[] = data.tendencia_por_fecha ?? [];
    this.tendenciaChart = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: tendencia.map((t: any) => t.fecha_solicitud)
      },
      yAxis: { type: 'value' },
      series: [{
        data: tendencia.map((t: any) => t.total),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#8b5cf6', width: 3 },
        itemStyle: { color: '#8b5cf6' },
        areaStyle: { opacity: 0.2, color: '#8b5cf6' },
        label: { show: true, position: 'top', fontSize: 12, fontWeight: 'bold' }
      }]
    };

    // 6. Distribución por edad (Histogram agrupado por décadas)
    const edades: any[] = data.distribucion_edad ?? [];
    const decadas: Record<string, number> = {
      '0-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-49': 0,
      '50-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90+': 0
    };
    for (const e of edades) {
      const age = e.edad_anios;
      if (age < 10) decadas['0-9'] += e.total;
      else if (age < 20) decadas['10-19'] += e.total;
      else if (age < 30) decadas['20-29'] += e.total;
      else if (age < 40) decadas['30-39'] += e.total;
      else if (age < 50) decadas['40-49'] += e.total;
      else if (age < 60) decadas['50-59'] += e.total;
      else if (age < 70) decadas['60-69'] += e.total;
      else if (age < 80) decadas['70-79'] += e.total;
      else if (age < 90) decadas['80-89'] += e.total;
      else decadas['90+'] += e.total;
    }
    this.edadChart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: Object.keys(decadas) },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: Object.values(decadas),
        itemStyle: {
          color: (params: any) => COLORS[params.dataIndex % COLORS.length],
          borderRadius: [4, 4, 0, 0]
        },
        label: { show: true, position: 'top', fontSize: 11 }
      }]
    };

    // 7. Tipo de seguro (Pie)
    const seguros: any[] = data.seguro_mas_usado ?? [];
    this.seguroChart = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'center', textStyle: { fontSize: 10 } },
      series: [{
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['60%', '50%'],
        label: { show: false },
        data: seguros.map((s: any, i: number) => ({
          name: s.tipo_seguro.trim(),
          value: s.total,
          itemStyle: { color: COLORS[i % COLORS.length] }
        }))
      }]
    };

    // 8. Área de laboratorio (Bar)
    const areas: any[] = data.area_laboratorio ?? [];
    this.areaChart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: areas.map((a: any) => a.area_lab),
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: areas.map((a: any) => a.total),
        itemStyle: {
          color: (params: any) => COLORS[params.dataIndex % COLORS.length],
          borderRadius: [4, 4, 0, 0]
        },
        label: { show: true, position: 'top', fontSize: 11 }
      }]
    };

    // 9. Top doctores (Bar horizontal)
    const doctores: any[] = (data.doctores_mas_atencion ?? []).slice(0, 10);
    this.doctoresChart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '6%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: [...doctores].reverse().map((d: any) => {
          const parts = d.profesional.split(' ');
          return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : d.profesional;
        }),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: [...doctores].reverse().map((d: any) => d.total),
        itemStyle: { color: '#ec4899', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', fontSize: 11 }
      }]
    };

    // 10. Pacientes por sede (Bar)
    const sedes: any[] = (data.pacientes_por_sede ?? [])
      .filter((s: any) => s.sede && s.sede.trim() !== '');
    this.sedeChart = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sedes.map((s: any) => s.sede),
        axisLabel: { rotate: 40, fontSize: 10 }
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: sedes.map((s: any) => s.total),
        itemStyle: {
          color: (params: any) => COLORS[params.dataIndex % COLORS.length],
          borderRadius: [4, 4, 0, 0]
        },
        label: { show: true, position: 'top', fontSize: 11 }
      }]
    };
  }
}