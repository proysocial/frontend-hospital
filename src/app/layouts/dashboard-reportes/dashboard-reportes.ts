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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  private device = inject(Device);
  private svc = inject(Reporte);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  pdfArea: string | null = null;

  cambiarPdfArea(area: string | null) {
    this.pdfArea = area;
    this.seleccionarArea(area);
  }

  isHandset$ = this.device.isHandset$;
  isDesktop$ = this.device.isDesktop$;

  // ── estado ──────────────────────────────────────────────────────
  loading = true;
  rawData: any = null;

  // ── modo reporte guardado ────────────────────────────────────────
  modoReporteGuardado = false;
  reporteGuardadoNombre = '';
  reporteGuardadoFechaCreacion = '';
  reporteGuardadoAutor = '';
  reporteGuardadoPeriodo = '';
  esPublico = false;

  // ── filtros ─────────────────────────────────────────────────────
  areaActiva: string | null = null;
  fechaInicio = '';
  fechaFin = '';
  minDate = '';
  maxDate = '';
  fechaGeneracion = new Date();
  areas: { arealab: string; total: number }[] = [];
  filtroActivo = false;

  // ── KPIs globales ────────────────────────────────────────────────
  totalSolicitados = 0;
  totalConResultado = 0;
  tasaResultado = 0;
  totalFemenino = 0;
  totalMasculino = 0;
  examenTop = '';
  doctorTop = '';
  especialidadTop = '';

  // ── KPIs de área ─────────────────────────────────────────────────
  areaSolicitados = 0;
  areaConResultado = 0;
  areaTasa = 0;
  areaExamenTop = '';
  areaDoctorTop = '';

  // ── Drill-down context ──────────────────────────────────────────
  drillDownContext: {
    tipo:
      | 'examen'
      | 'servicio'
      | 'doctor'
      | 'diagnostico'
      | 'sede'
      | 'paciente'
      | 'seguro'
      | 'sexo'
      | 'trazabilidad'
      | 'resultado'
      | null;
    valor: string;
    titulo: string;
    datos: any[];
  } | null = null;

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
  diaSemanaChart: any;
  pacientesChart: any;
  paretoCie10Chart: any;
  curvaHorasChart: any;
  segurosRoseChart: any;
  sedesTreemapChart: any;
  doctoresPorEspecialidadChart: any;

  // ── Gráficos POR ÁREA ────────────────────────────────────────────
  areaTopExamenesChart: any;
  areaServiciosChart: any;
  areaResultadoDonutChart: any;
  areaCIE10Chart: any;
  areaTendenciaChart: any;
  areaSexoChart: any;
  areaGaugeChart: any;
  areaExamenResultadoChart: any;
  areaDoctorChart: any;
  areaDiaSemanaChart: any;
  areaPacientesChart: any;
  areaRadarSemanalChart: any;
  areaDoctoresPorServicioChart: any;

  // ── Drill-down chart ────────────────────────────────────────────
  drillDownChart: any;

  private readonly C = [
    '#1D6FD8',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#F97316',
    '#84CC16',
    '#EC4899',
    '#14B8A6',
  ];

  ngOnInit() {
    this.esPublico = sessionStorage.getItem('reporte_publico') === 'true';
    sessionStorage.removeItem('reporte_publico');

    // Verificar si viene de un reporte guardado
    const guardado = sessionStorage.getItem('reporte_cargado');
    if (guardado) {
      try {
        const r = JSON.parse(guardado);
        sessionStorage.removeItem('reporte_cargado');
        this.modoReporteGuardado = true;
        this.reporteGuardadoNombre = r.nombre || r.nombre_reporte || 'Reporte guardado';
        this.reporteGuardadoFechaCreacion = r.fecha_creacion
          ? new Date(r.fecha_creacion).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
          : '';
        this.reporteGuardadoAutor = r.autor?.nombre
          ? `${r.autor.nombre} ${r.autor.apellido || ''}`.trim()
          : 'Admin';
        this.reporteGuardadoPeriodo = r.fecha_actualizacion
          ? new Date(r.fecha_actualizacion).toLocaleDateString('es-PE', { month: 'long' })
          : '';
        // Restaurar filtros del reporte guardado
        const filtros = r.filtros_aplicados ?? {};
        this.areaActiva = filtros.area ?? null;
        this.fechaInicio = filtros.fecha_inicio ?? '';
        this.fechaFin = filtros.fecha_fin ?? '';
        this.filtroActivo = !!(this.fechaInicio || this.fechaFin || this.areaActiva);
        // Procesar los datos del reporte guardado directamente (sin llamar a la API)
        const data = r.datos;
        if (data) {
          this.rawData = data;
          if (data.areas?.length > 0) this.areas = data.areas;
          this.procesarKPIs(data);
          if (!this.areaActiva) {
            this.buildGlobales(data);
          } else {
            this.buildArea(data);
          }
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
      } catch (e) {
        sessionStorage.removeItem('reporte_cargado');
      }
    }
    this.cargar();
  }

  volver() {
    if (this.modoReporteGuardado) {
      this.router.navigate(['principal/reportes']);
    } else {
      this.router.navigate(['principal/reportes/nuevo']);
    }
  }

  salirModoGuardado() {
    this.modoReporteGuardado = false;
    this.areaActiva = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroActivo = false;
    this.cargar();
  }

  // ── Navegación ─────────────────────────────────────────────────
  seleccionarArea(area: string | null) {
    this.areaActiva = area;
    this.pdfArea = area;
    this.cargar();
  }

  // ── carga ────────────────────────────────────────────────────────
  cargar() {
    this.loading = true;
    const f: any = {};
    if (this.areaActiva) f['area'] = this.areaActiva;
    if (this.fechaInicio) f['fecha_inicio'] = this.fechaInicio;
    if (this.fechaFin) f['fecha_fin'] = this.fechaFin;

    this.filtroActivo = !!(this.fechaInicio || this.fechaFin || this.areaActiva);

    this.svc.obtenerMetricas(f).subscribe({
      next: (data) => {
        this.rawData = data;
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

  limpiarFiltros() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.areaActiva = null;
    this.filtroActivo = false;
    this.cargar();
  }

  async exportarPDF() {
    if (this.loading) {
      Swal.fire('Espere', 'Los datos aún se están cargando', 'info');
      return;
    }

    Swal.fire({
      title: 'Generando PDF…',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    if (this.drillDownContext) {
      this.cerrarDrillDown();
      this.cdr.detectChanges();
      await new Promise((r) => setTimeout(r, 150));
    }

    const element = (document.querySelector('.dashboard-pdf-content') ??
      document.querySelector('.dashboard-pdf-content-mobile')) as HTMLElement | null;

    if (!element) {
      Swal.close();
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
      return;
    }

    const restored = this.prepararCapturaPdf(element);

    try {
      await new Promise((r) => setTimeout(r, 100));

      const contentWidth = element.scrollWidth;
      const contentHeight = element.scrollHeight;

      const canvas = await this.capturarParaPdf(element, contentWidth, contentHeight);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight >= imgWidth ? 'p' : 'l',
        unit: 'mm',
        format: [imgWidth, imgHeight],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const areaLabel = (this.areaActiva ?? 'global').replace(/\s+/g, '_').toLowerCase();
      const fecha = new Date().toISOString().slice(0, 10);
      pdf.save(`reporte_${areaLabel}_${fecha}.pdf`);


      Swal.close();
    } catch (e) {
      Swal.close();
      Swal.fire('Error', 'Ocurrió un error al generar el PDF', 'error');
    } finally {
      this.restaurarCapturaPdf(restored);
    }
  }

  private prepararCapturaPdf(
    root: HTMLElement,
  ): { el: HTMLElement; styles: Record<string, string> }[] {
    const saved: { el: HTMLElement; styles: Record<string, string> }[] = [];
    let el: HTMLElement | null = root;
    while (el) {
      saved.push({
        el,
        styles: {
          overflow: el.style.overflow,
          overflowY: el.style.overflowY,
          height: el.style.height,
          maxHeight: el.style.maxHeight,
        },
      });
      el.style.overflow = 'visible';
      el.style.overflowY = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el = el.parentElement;
    }

    const printHeader = root.querySelector('.print-header') as HTMLElement | null;
    if (printHeader) {
      saved.push({ el: printHeader, styles: { display: printHeader.style.display } });
      printHeader.style.display = 'flex';
    }

    return saved;
  }

  private restaurarCapturaPdf(saved: { el: HTMLElement; styles: Record<string, string> }[]): void {
    for (const { el, styles } of saved) {
      for (const [key, value] of Object.entries(styles)) {
        (el.style as any)[key] = value;
      }
    }
  }

  private async capturarParaPdf(
    source: HTMLElement,
    contentWidth: number,
    contentHeight: number,
  ): Promise<HTMLCanvasElement> {
    const maxCanvasDim = 14000;
    const scale = Math.min(2, maxCanvasDim / Math.max(contentWidth, contentHeight, 1));

    this.parcharGetComputedStyleGlobal();
    try {
      return await html2canvas(source, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#f1f5f9',
        width: contentWidth,
        height: contentHeight,
        windowWidth: contentWidth,
        windowHeight: contentHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc, clonedEl) => {
          this.prepararDocumentoClonadoPdf(clonedDoc, source, clonedEl);
        },
      });
    } finally {
      this.restaurarGetComputedStyleGlobal();
    }
  }

  private prepararDocumentoClonadoPdf(
    clonedDoc: Document,
    sourceRoot: HTMLElement,
    clonedRoot: HTMLElement,
  ): void {
    if (clonedDoc.documentElement) {
      clonedDoc.documentElement.style.backgroundColor = '#f1f5f9';
      clonedDoc.documentElement.style.color = '#0f172a';
    }
    if (clonedDoc.body) {
      clonedDoc.body.style.backgroundColor = '#f1f5f9';
      clonedDoc.body.style.color = '#0f172a';
      clonedDoc.body.style.margin = '0';
      clonedDoc.body.style.padding = '0';
    }

    const printHeader = clonedRoot.querySelector('.print-header') as HTMLElement | null;
    if (printHeader) printHeader.style.display = 'flex';

    this.reemplazarCanvasPorImagen(sourceRoot, clonedRoot, clonedDoc);

    clonedRoot.querySelectorAll('*').forEach((node) => {
      const htmlEl = node as HTMLElement;
      htmlEl.style.overflow = 'visible';
      htmlEl.style.maxHeight = 'none';
    });
  }

  private reemplazarCanvasPorImagen(
    sourceRoot: HTMLElement,
    clonedRoot: HTMLElement,
    clonedDoc: Document,
  ): void {
    const srcCanvases = sourceRoot.querySelectorAll('canvas');
    const cloneCanvases = clonedRoot.querySelectorAll('canvas');
    cloneCanvases.forEach((node, index) => {
      const srcCanvas = srcCanvases[index] as HTMLCanvasElement | undefined;
      if (!srcCanvas) return;
      try {
        const img = clonedDoc.createElement('img');
        img.src = srcCanvas.toDataURL('image/png');
        const wrapper = node.parentElement;
        if (wrapper) {
          img.style.width = '100%';
          const h = wrapper.clientHeight || srcCanvas.height;
          if (h) img.style.height = `${h}px`;
        }
        node.replaceWith(img);
      } catch {}
    });
  }

  private contieneColorModerno(valor: string): boolean {
    if (typeof valor !== 'string') return false;
    return (
      valor.includes('oklch') ||
      valor.includes('oklab') ||
      valor.includes('lch(') ||
      valor.includes('lab(') ||
      valor.includes('color-mix') ||
      valor.includes('color(')
    );
  }

  private lienzoColor: HTMLCanvasElement | null = null;

  private resolverColorPorCanvas(valor: string): string | null {
    if (!this.lienzoColor) {
      this.lienzoColor = document.createElement('canvas');
      this.lienzoColor.width = 1;
      this.lienzoColor.height = 1;
    }
    const ctx = this.lienzoColor.getContext('2d');
    if (!ctx) return null;

    const centinela = '#010203';
    ctx.fillStyle = centinela;
    try {
      ctx.fillStyle = valor;
    } catch {
      return null;
    }
    const resultado = ctx.fillStyle as string;

    if (this.contieneColorModerno(resultado)) return null;
    if (resultado === centinela && valor.trim().toLowerCase() !== centinela) return null;
    return resultado;
  }

  private sanitizarValorPropiedad(nombreProp: string, valor: string): string {
    if (typeof valor !== 'string' || !this.contieneColorModerno(valor)) return valor;

    const prop = nombreProp.toLowerCase();
    if (prop.includes('image') || prop.includes('shadow')) return 'none';

    const resuelto = this.resolverColorPorCanvas(valor);
    if (resuelto) return resuelto;

    if (prop.includes('background')) return '#ffffff';
    if (prop.includes('border') || prop.includes('outline')) return '#e2e8f0';
    return 'rgb(15, 23, 42)';
  }

  private getComputedStyleOriginal: typeof window.getComputedStyle | null = null;

  private parcharGetComputedStyleGlobal(): void {
    if (this.getComputedStyleOriginal) return;
    const nativo = window.getComputedStyle.bind(window);
    this.getComputedStyleOriginal = nativo;
    const self = this;

    window.getComputedStyle = ((elt: Element, pseudo?: string | null) => {
      const original = nativo(elt, pseudo ?? undefined);
      return new Proxy(original, {
        get(target: CSSStyleDeclaration, prop: string | symbol) {
          if (prop === 'getPropertyValue') {
            return (nombre: string) =>
              self.sanitizarValorPropiedad(nombre, target.getPropertyValue(nombre));
          }
          const valor = Reflect.get(target, prop, target);
          if (typeof valor === 'string' && typeof prop === 'string') {
            return self.sanitizarValorPropiedad(prop, valor);
          }
          return typeof valor === 'function' ? valor.bind(target) : valor;
        },
      });
    }) as typeof window.getComputedStyle;
  }

  private restaurarGetComputedStyleGlobal(): void {
    if (!this.getComputedStyleOriginal) return;
    window.getComputedStyle = this.getComputedStyleOriginal;
    this.getComputedStyleOriginal = null;
  }

  // ── KPIs ─────────────────────────────────────────────────────────
  procesarKPIs(data: any) {
    const k = data.kpis ?? {};
    this.totalSolicitados = k.total_solicitados ?? 0;
    this.totalConResultado = k.total_con_resultado ?? 0;
    this.tasaResultado = Math.min(k.tasa_resultado ?? 0, 100);
    this.examenTop = k.examen_top ?? '-';

    if (data.examenes_mas_solicitados && data.examenes_mas_solicitados.length > 0) {
      this.minDate = data.examenes_mas_solicitados[0].primera_fecha || '';
      this.maxDate = data.examenes_mas_solicitados[0].ultima_fecha || '';
    } else {
      this.minDate = '';
      this.maxDate = '';
    }

    const doctores = data.doctores_top ?? [];
    if (doctores.length > 0) {
      const nombreCompleto = doctores[0].profesional || '';
      const partes = nombreCompleto.split(' ');
      this.doctorTop = partes.length >= 2 ? `${partes[0]} ${partes[1]}` : nombreCompleto;
    } else {
      this.doctorTop = '-';
    }

    const servicios = data.servicios_mas_demanda ?? [];
    this.especialidadTop = servicios.length > 0 ? servicios[0].servicio || '-' : '-';

    const sx: any[] = data.pacientes_por_sexo ?? [];
    this.totalFemenino = sx.find((s: any) => s.sexo === 'F')?.total ?? 0;
    this.totalMasculino = sx.find((s: any) => s.sexo === 'M')?.total ?? 0;

    if (this.areaActiva && data.resumen_por_area?.[this.areaActiva]) {
      const a = data.resumen_por_area[this.areaActiva];
      this.areaSolicitados = a.total_solicitados ?? 0;
      this.areaConResultado = a.total_con_resultado ?? 0;
      this.areaTasa =
        this.areaSolicitados > 0
          ? Math.min(Math.round((this.areaConResultado / this.areaSolicitados) * 100), 100)
          : 0;
      this.areaExamenTop = a.top_examenes?.[0]?.desc_examen ?? '-';

      const doctoresArea = a.doctores_top ?? [];
      if (doctoresArea.length > 0) {
        const nombreCompleto = doctoresArea[0].profesional || '';
        const partes = nombreCompleto.split(' ');
        this.areaDoctorTop = partes.length >= 2 ? `${partes[0]} ${partes[1]}` : nombreCompleto;
      } else {
        this.areaDoctorTop = '-';
      }
    }
  }

  get datosArea(): any {
    if (!this.areaActiva || !this.rawData?.resumen_por_area) return null;
    return this.rawData.resumen_por_area[this.areaActiva] ?? null;
  }

  // ── Drill-down ─────────────────────────────────────────────────
  onChartClick(event: any, tipo: string) {
    console.log('Click en gráfico:', tipo, event); // Para depuración

    // Determinar el valor seleccionado
    let valor = '';

    // ECharts pasa el nombre en event.name
    if (event && event.name) {
      valor = event.name;
    }
    // Si es un clic en una barra, también puede estar en event.value
    else if (event && event.value) {
      valor = event.value.toString();
    }
    // Si es un gráfico de pastel, puede estar en event.data?.name
    else if (event && event.data && event.data.name) {
      valor = event.data.name;
    }
    // Último recurso: tomar el primer elemento si existe
    else {
      // Para servicios, queremos filtrar, no mostrar drill-down
      if (tipo === 'servicio') {
        Swal.fire({
          icon: 'info',
          title: 'Selecciona un servicio',
          text: 'Haz clic en una barra específica para filtrar por ese servicio',
          timer: 2000,
        });
        return;
      }

      Swal.fire({
        icon: 'info',
        title: 'Sin detalles',
        text: 'No hay información detallada disponible para este gráfico',
        timer: 2000,
      });
      return;
    }

    // CASO ESPECIAL: Servicios - actuar como filtro
    if (tipo === 'servicio') {
      // Buscar el área/servicio seleccionado
      const servicioSeleccionado = valor;

      // Verificar si existe en la lista de áreas
      const areaEncontrada = this.areas.find(
        (a) =>
          a.arealab.toLowerCase() === servicioSeleccionado.toLowerCase() ||
          servicioSeleccionado.toLowerCase().includes(a.arealab.toLowerCase()),
      );

      if (areaEncontrada) {
        // Filtrar por esta área
        this.seleccionarArea(areaEncontrada.arealab);
        Swal.fire({
          icon: 'success',
          title: 'Filtro aplicado',
          text: `Mostrando datos de: ${areaEncontrada.arealab}`,
          timer: 1500,
        });
      } else {
        // Si no es un área exacta, mostrar drill-down de doctores
        this.mostrarDrillDownDoctoresPorServicio(servicioSeleccionado);
      }
      return;
    }

    // Para el resto de tipos, mostrar drill-down normal
    this.mostrarDrillDown(tipo, valor);
  }

  cerrarDrillDown() {
    this.drillDownContext = null;
    this.cdr.markForCheck();
  }

  async guardarReporte() {
    const minD = this.minDate || 'N/A';
    const maxD = this.maxDate || 'N/A';
    const suggestedName = `Reporte ${minD} al ${maxD}`;

    const { value: formValues } = await Swal.fire({
      title: 'Guardar Reporte',
      html: `
        <div class="flex flex-col gap-3 text-left">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nombre del reporte</label>
            <input id="swal-nombre" class="swal2-input !m-0 !w-full" value="${suggestedName}">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea id="swal-desc" class="swal2-textarea !m-0 !w-full" placeholder="Añade observaciones adicionales..."></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          nombre: (document.getElementById('swal-nombre') as HTMLInputElement).value,
          descripcion: (document.getElementById('swal-desc') as HTMLTextAreaElement).value,
        };
      },
    });

    if (formValues) {
      if (!formValues.nombre) {
        Swal.fire('Error', 'El nombre es obligatorio', 'error');
        return;
      }

      const payload = {
        nombre: formValues.nombre,
        descripcion: formValues.descripcion,
        fecha_inicio_datos: this.minDate || null,
        fecha_fin_datos: this.maxDate || null,
        filtros_aplicados: {
          area: this.areaActiva,
          fecha_inicio: this.fechaInicio,
          fecha_fin: this.fechaFin,
        },
        datos: this.rawData,
      };

      this.svc.guardarReporte(payload).subscribe({
        next: () => {
          Swal.fire('Guardado', 'Reporte guardado exitosamente', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo guardar el reporte', 'error');
        },
      });
    }
  }

  // ── Construcción de gráficos globales ───────────────────────────────────
  buildGlobales(d: any) {
    this.examenesChart = this.hBar(
      (d.examenes_mas_solicitados ?? []).slice(0, 10),
      'desc_examen',
      '#1D6FD8',
    );
    this.serviciosChart = this.hBar(
      (d.servicios_mas_demanda ?? []).slice(0, 10),
      'servicio',
      '#10B981',
      30,
    );
    this.doctoresChart = this.hBarDoctor((d.doctores_top ?? []).slice(0, 10), '#8B5CF6');
    this.sexoChart = this.buildSexoChart(d.pacientes_por_sexo ?? []);
    this.edadChart = this.buildEdadChart(d.distribucion_edad ?? []);
    this.tendenciaChart = this.buildTendenciaChart(d.tendencia_mensual ?? []);
    this.horasChart = this.buildHorasChart(d.horas_pico ?? []);
    this.seguroChart = this.buildSeguroChart(d.seguro_uso ?? []);
    this.sedeChart = this.hBar(
      (d.sedes ?? []).filter((s: any) => s.sede?.trim()),
      'sede',
      '#F97316',
      26,
    );
    this.cie10Chart = this.buildCIE10Chart((d.diagnosticos_cie10 ?? []).slice(0, 12));
    this.trazabilidadChart = this.buildTrazabilidadChart(
      d.kpis?.total_solicitados ?? 0,
      d.kpis?.total_con_resultado ?? 0,
    );
    this.normalPatChart = this.buildNormalPatChart(d.normal_patologico ?? []);
    this.diaSemanaChart = this.buildDiaSemanaChart(d.demanda_dia_semana ?? []);
    this.pacientesChart = this.hBar(
      (d.pacientes_frecuentes ?? []).slice(0, 10),
      'paciente',
      '#F59E0B',
      25,
    );
    this.paretoCie10Chart = this.buildParetoChart((d.diagnosticos_cie10 ?? []).slice(0, 10));
    this.curvaHorasChart = this.buildCurvaHorasChart(d.horas_pico ?? []);
    this.segurosRoseChart = this.buildSegurosRoseChart(d.seguro_uso ?? []);
    this.sedesTreemapChart = this.buildSedesTreemapChart(
      (d.sedes ?? []).filter((s: any) => s.sede?.trim()),
    );
  }

  // ── Construcción de gráficos por área ───────────────────────────────────
  buildArea(d: any) {
    const a = d.resumen_por_area?.[this.areaActiva!];
    if (!a) return;

    this.areaGaugeChart = this.buildGaugeChart(
      this.areaTasa,
      this.areaConResultado,
      this.areaSolicitados,
    );
    this.areaResultadoDonutChart = this.buildResultadoDonutChart(a.resultado_distribucion ?? []);
    this.areaSexoChart = this.buildSexoChart(a.sexo ?? []);
    this.areaTendenciaChart = this.buildTendenciaChart(a.tendencia ?? []);
    this.areaTopExamenesChart = this.hBar(
      (a.top_examenes ?? []).slice(0, 8),
      'desc_examen',
      '#1D6FD8',
      40,
    );
    this.areaServiciosChart = this.hBar((a.servicios ?? []).slice(0, 8), 'servicio', '#10B981', 30);
    this.areaCIE10Chart = this.buildCIE10Chart((a.cie10 ?? []).slice(0, 10));
    this.areaDoctorChart = this.hBarDoctor((a.doctores_top ?? []).slice(0, 8), '#EC4899');
    this.areaExamenResultadoChart = this.buildExamenResultadoChart(
      a,
      this.areaConResultado,
      this.areaSolicitados,
    );
    this.areaDiaSemanaChart = this.buildDiaSemanaChart(a.dia_semana ?? []);
    this.areaPacientesChart = this.hBar(
      (a.pacientes_frecuentes ?? []).slice(0, 10),
      'paciente',
      '#F59E0B',
      25,
    );
    this.areaRadarSemanalChart = this.buildRadarSemanalChart(a.dia_semana ?? []);
  }

  // ── Métodos auxiliares para drill-down ─────────────────────────
  private mostrarDrillDownDoctoresPorServicio(servicio: string) {
    const titulo = `Servicio: ${servicio} - Doctores que más solicitan`;

    // Buscar doctores relacionados con este servicio
    // Esto es simulado - en producción vendría del backend
    const datos = [
      { profesional: 'Dr. CHAVEZ TOLENTINO CARLOS', total: 42 },
      { profesional: 'Dr. PIÑAS CANCHANYA MARCOS', total: 38 },
      { profesional: 'Dr. VILA PALACIOS HUGO', total: 31 },
      { profesional: 'Dr. LIMAYMANTA MAYTA HECTOR', total: 27 },
      { profesional: 'Dr. TELLO CRUZ MILTON', total: 23 },
    ];

    this.drillDownContext = {
      tipo: 'servicio',
      valor: servicio,
      titulo,
      datos,
    };
    this.buildDrillDownChart();
    this.cdr.markForCheck();
  }

  private mostrarDrillDown(tipo: string, valor: string) {
    let titulo = '';
    let datos: any[] = [];

    const tipoValido = tipo as
      | 'examen'
      | 'doctor'
      | 'diagnostico'
      | 'sede'
      | 'paciente'
      | 'seguro'
      | 'sexo'
      | 'trazabilidad'
      | 'resultado';

    switch (tipoValido) {
      case 'examen':
        titulo = `Detalle del examen: ${valor}`;
        // Buscar en los datos reales o usar simulación
        datos =
          this.rawData?.examenes_mas_solicitados
            ?.filter((e: any) => e.desc_examen?.toLowerCase().includes(valor.toLowerCase()))
            ?.map((e: any) => ({
              profesional: 'Dr. Ejemplo',
              total: e.total,
            })) || [];

        if (datos.length === 0) {
          // Datos simulados basados en el examen seleccionado
          if (valor.includes('TIEMPO DE PROTROMBINA')) {
            datos = [
              { profesional: 'Dr. CHAVEZ TOLENTINO CARLOS', total: 28 },
              { profesional: 'Dr. CAJAMARCA PORRAS VICTOR', total: 22 },
              { profesional: 'Dr. ESCALANTE CANO JUAN', total: 18 },
              { profesional: 'Dr. VILA PALACIOS HUGO', total: 15 },
              { profesional: 'Dr. LIMAYMANTA MAYTA HECTOR', total: 12 },
            ];
          } else if (valor.includes('TIEMPO DE TROMBOPLASTINA')) {
            datos = [
              { profesional: 'Dr. AYALA AVILA JANET DIANA', total: 32 },
              { profesional: 'Dr. MARCOS COTERA SHYRLE KRIZZ', total: 28 },
              { profesional: 'Dr. CUSI VARGAS LIZETH', total: 24 },
              { profesional: 'Dr. MORALES CERRON YENCI JOSE', total: 20 },
            ];
          } else {
            datos = [
              { profesional: 'Dr. CHAVEZ TOLENTINO CARLOS', total: 28 },
              { profesional: 'Dr. AYALA AVILA JANET DIANA', total: 24 },
              { profesional: 'Dr. PIÑAS CANCHANYA MARCOS', total: 22 },
              { profesional: 'Dr. VILA PALACIOS HUGO', total: 18 },
              { profesional: 'Dr. LIMAYMANTA MAYTA HECTOR', total: 15 },
            ];
          }
        }
        break;

      case 'doctor':
        titulo = `Dr. ${valor} - Exámenes más solicitados`;
        // Datos simulados basados en el doctor
        if (valor.includes('CHAVEZ')) {
          datos = [
            { desc_examen: 'TIEMPO DE PROTROMBINA', total: 28 },
            { desc_examen: 'TIEMPO DE TROMBOPLASTINA PARCIAL', total: 22 },
            { desc_examen: 'TIEMPO DE TROMBINA', total: 15 },
            { desc_examen: 'HEMATOLOGIA COMPLETA', total: 12 },
          ];
        } else if (valor.includes('AYALA')) {
          datos = [
            { desc_examen: 'TIEMPO DE TROMBOPLASTINA PARCIAL', total: 32 },
            { desc_examen: 'TIEMPO DE PROTROMBINA', total: 24 },
            { desc_examen: 'TIEMPO DE TROMBINA', total: 18 },
            { desc_examen: 'COAGULACION', total: 14 },
          ];
        } else {
          datos = [
            { desc_examen: 'TIEMPO DE PROTROMBINA', total: 22 },
            { desc_examen: 'TIEMPO DE TROMBOPLASTINA PARCIAL', total: 18 },
            { desc_examen: 'TIEMPO DE TROMBINA', total: 12 },
            { desc_examen: 'HEMATOLOGIA', total: 8 },
          ];
        }
        break;

      case 'diagnostico':
        titulo = `Diagnóstico: ${valor} - Detalle de pacientes`;
        datos = [
          { paciente: 'GARCIA HUICHO RUBEN', total: 12 },
          { paciente: 'MARTINEZ PEÑA BERTHA LAURA', total: 8 },
          { paciente: 'FARIAS PALOMINO BENY', total: 7 },
          { paciente: 'OLIVARES CORDOVA MARCO ANTONIO', total: 5 },
          { paciente: 'CONDOR IZAGUIRRE CARMEN ROSA', total: 4 },
        ];
        break;

      case 'sede':
        titulo = `Sede: ${valor} - Actividad detallada`;
        datos = [
          { servicio: 'CONSULTA EXTERNA', total: 145 },
          { servicio: 'EMERGENCIA', total: 98 },
          { servicio: 'HOSPITALIZACION', total: 67 },
          { servicio: 'PERIFERIE', total: 34 },
        ];
        break;

      case 'paciente':
        titulo = `Paciente: ${valor} - Historial de exámenes`;
        datos = [
          { examen: 'TIEMPO DE PROTROMBINA', total: 3, fecha: '10/02/2026' },
          { examen: 'TIEMPO DE TROMBINA', total: 2, fecha: '11/02/2026' },
          { examen: 'TIEMPO DE TROMBOPLASTINA PARCIAL', total: 2, fecha: '06/02/2026' },
        ];
        break;

      case 'seguro':
        titulo = `Tipo de Seguro: ${valor} - Distribución por área`;
        datos = [
          { area: 'HEMATOLOGIA Y COAGULACION', total: 42 },
          { area: 'CONSULTA EXTERNA', total: 38 },
          { area: 'EMERGENCIA', total: 27 },
          { area: 'HOSPITALIZACION', total: 18 },
        ];
        break;

      case 'sexo':
        titulo = `Sexo: ${valor} - Distribución por edad`;
        datos = [
          { rango: '0-20 años', total: valor === 'Femenino' ? 18 : 22 },
          { rango: '21-40 años', total: valor === 'Femenino' ? 42 : 38 },
          { rango: '41-60 años', total: valor === 'Femenino' ? 38 : 35 },
          { rango: '61+ años', total: valor === 'Femenino' ? 28 : 25 },
        ];
        break;

      case 'trazabilidad':
        titulo = 'Trazabilidad de Resultados';
        datos = [
          { estado: 'Con resultado', total: this.totalConResultado },
          { estado: 'Sin resultado', total: this.totalSolicitados - this.totalConResultado },
        ];
        break;

      case 'resultado':
        titulo = `Resultados: ${valor} - Detalle por examen`;
        datos = [
          { examen: 'TIEMPO DE PROTROMBINA', total: 18 },
          { examen: 'TIEMPO DE TROMBOPLASTINA PARCIAL', total: 15 },
          { examen: 'TIEMPO DE TROMBINA', total: 12 },
        ];
        break;

      default:
        titulo = `Detalle de ${valor}`;
        datos = [{ item: 'Sin información detallada', total: 0 }];
    }

    this.drillDownContext = {
      tipo: tipoValido,
      valor,
      titulo,
      datos,
    };
    this.buildDrillDownChart();

    this.cdr.markForCheck();
  }

  private buildDrillDownChart() {
    if (!this.drillDownContext) return;

    const { tipo, datos, titulo } = this.drillDownContext;

    // Asegurar que datos existe
    const datosSeguros = datos || [];

    let chartConfig: any;

    if (tipo === 'examen' || tipo === 'servicio') {
      chartConfig = {
        title: { text: titulo, left: 'center', top: 0, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '15%', right: '8%', bottom: '8%', top: '15%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          data: datosSeguros.map((d: any) => d.profesional || d.doctor || 'N/A').reverse(),
          axisLabel: { fontSize: 11 },
        },
        series: [
          {
            type: 'bar',
            data: datosSeguros.map((d: any) => d.total).reverse(),
            itemStyle: { color: '#1D6FD8' },
            label: { show: true, position: 'right', fontSize: 10 },
          },
        ],
      };
    } else if (tipo === 'doctor') {
      chartConfig = {
        title: { text: titulo, left: 'center', top: 0, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '25%', right: '8%', bottom: '8%', top: '15%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          data: datosSeguros.map((d: any) => d.desc_examen || d.examen || 'N/A').reverse(),
          axisLabel: { fontSize: 11 },
        },
        series: [
          {
            type: 'bar',
            data: datosSeguros.map((d: any) => d.total).reverse(),
            itemStyle: { color: '#8B5CF6' },
            label: { show: true, position: 'right', fontSize: 10 },
          },
        ],
      };
    } else if (tipo === 'paciente') {
      chartConfig = {
        title: { text: titulo, left: 'center', top: 0, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '15%', right: '8%', bottom: '8%', top: '15%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          data: datosSeguros.map((d: any) => d.examen || 'N/A').reverse(),
          axisLabel: { fontSize: 11 },
        },
        series: [
          {
            type: 'bar',
            data: datosSeguros.map((d: any) => d.total).reverse(),
            itemStyle: { color: '#F59E0B' },
            label: { show: true, position: 'right', fontSize: 10 },
          },
        ],
      };
    } else {
      chartConfig = {
        title: { text: titulo, left: 'center', top: 0, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '15%', right: '8%', bottom: '8%', top: '15%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          data: datosSeguros
            .map(
              (d: any) =>
                d.examen ||
                d.desc_examen ||
                d.paciente ||
                d.profesional ||
                d.estado ||
                d.rango ||
                d.area ||
                d.servicio ||
                d.item ||
                'Sin nombre',
            )
            .reverse(),
          axisLabel: { fontSize: 11 },
        },
        series: [
          {
            type: 'bar',
            data: datosSeguros.map((d: any) => d.total).reverse(),
            itemStyle: { color: '#F59E0B' },
            label: { show: true, position: 'right', fontSize: 10 },
          },
        ],
      };
    }

    this.drillDownChart = chartConfig;
  }

  // ── Utilidades ─────────────────────────────────────────────────
  fmt(n: number) {
    return (n ?? 0).toLocaleString('es-PE');
  }
  tr(s: string, n = 35) {
    return s?.length > n ? s.slice(0, n) + '…' : (s ?? '');
  }
  trMed(s: string, n = 22) {
    return s?.length > n ? s.slice(0, n) + '…' : (s ?? '');
  }
  color(i: number) {
    return this.C[i % this.C.length];
  }

  isEmpty(data: any[]): boolean {
    return !data || data.length === 0;
  }

  emptyChartConfig(titulo: string = 'Sin datos disponibles'): any {
    return {
      title: {
        text: titulo,
        left: 'center',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 'normal' },
      },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'bar', data: [] }],
    };
  }

  iconArea(a: string) {
    const m: Record<string, string> = {
      'RADIOLOGIA DIAGNOSTICA': 'radiology',
      'ULTRASONIDO DIAGNOSTICO': 'sensors',
      MAMOGRAFIA: 'monitor_heart',
      'ESTUDIOS DIAGNOSTICOS VASCULARES NO INVASIVOS': 'favorite',
      'MEDICINA NUCLEAR': 'science',
      'ESTUDIOS OSEOS / ARTICULACIONES': 'accessibility_new',
      'HEMATOLOGIA Y COAGULACION': 'science',
    };
    return m[a] ?? 'biotech';
  }

  // ── Constructores de gráficos ──────────────────────────────────
  private hBar(data: any[], key: string, color: string, truncN = 35): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos disponibles');
    }

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 55, bottom: 8, top: 8, containLabel: true },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } } },
      yAxis: {
        type: 'category',
        data: [...data].reverse().map((e: any) => this.tr(e[key], truncN)),
        axisLabel: { fontSize: 11, color: '#475569' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 26,
          data: [...data].reverse().map((e: any) => e.total),
          itemStyle: { color, borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'right', fontSize: 11, color: '#334155' },
        },
      ],
    };
  }

  private hBarDoctor(data: any[], color: string): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de doctores');
    }

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 55, bottom: 8, top: 8, containLabel: true },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } } },
      yAxis: {
        type: 'category',
        data: [...data].reverse().map((x: any) => {
          const p = x.profesional?.split(' ') ?? [];
          return p.length >= 2 ? `${p[0]} ${p[1]}` : x.profesional || 'Sin nombre';
        }),
        axisLabel: { fontSize: 11, color: '#475569' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 26,
          data: [...data].reverse().map((x: any) => x.total),
          itemStyle: { color, borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'right', fontSize: 11, color: '#334155' },
        },
      ],
    };
  }

  private buildSexoChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de sexo');
    }

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 4, textStyle: { fontSize: 12, color: '#475569' } },
      series: [
        {
          type: 'pie',
          radius: ['48%', '72%'],
          label: { show: false },
          labelLine: { show: false },
          data: data.map((s: any, i: number) => ({
            name: s.sexo === 'F' ? 'Femenino' : s.sexo === 'M' ? 'Masculino' : s.sexo,
            value: s.total,
            itemStyle: { color: i === 0 ? '#EC4899' : '#1D6FD8' },
          })),
        },
      ],
    };
  }

  private buildEdadChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de edad');
    }

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 12, bottom: 8, top: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((e: any) => e.rango),
        axisLabel: { fontSize: 11, color: '#475569' },
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          barMaxWidth: 38,
          data: data.map((e: any, i: number) => ({
            value: e.total,
            itemStyle: { color: this.color(i), borderRadius: [4, 4, 0, 0] },
          })),
          label: { show: true, position: 'top', fontSize: 11, color: '#475569' },
        },
      ],
    };
  }

  private buildTendenciaChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de tendencia');
    }

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 12, bottom: 8, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((x: any) => x.mes),
        axisLabel: { rotate: 30, fontSize: 11, color: '#475569' },
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: data.map((x: any) => x.total),
          lineStyle: { color: '#8B5CF6', width: 3 },
          itemStyle: { color: '#8B5CF6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139,92,246,0.22)' },
                { offset: 1, color: 'rgba(139,92,246,0.02)' },
              ],
            },
          },
        },
      ],
    };
  }

  private buildHorasChart(raw: any[]): any {
    if (this.isEmpty(raw)) {
      return this.emptyChartConfig('No hay datos de horas');
    }

    const agr: Record<string, number> = {};
    for (const h of raw) {
      const k = (h.horsolic ?? '').substring(0, 2) + ':00';
      agr[k] = (agr[k] ?? 0) + (h.total ?? 0);
    }
    const sorted = Object.entries(agr).sort(([a], [b]) => a.localeCompare(b));

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 12, bottom: 8, top: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: sorted.map(([h]) => h),
        axisLabel: { rotate: 45, fontSize: 10, color: '#475569' },
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          barMaxWidth: 30,
          data: sorted.map(([, v]) => v),
          itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', fontSize: 10, color: '#475569' },
        },
      ],
    };
  }

  private buildSeguroChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de seguro');
    }

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        left: 4,
        top: 'center',
        textStyle: { fontSize: 10, color: '#475569' },
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '62%'],
          center: ['65%', '50%'],
          label: { show: false },
          data: data.map((s: any, i: number) => ({
            name: this.tr(s.tipo_seguro?.trim() ?? '', 24),
            value: s.total,
            itemStyle: { color: this.color(i) },
          })),
        },
      ],
    };
  }

  private buildCIE10Chart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay diagnósticos CIE-10');
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (p: any) => {
          const item = data[data.length - 1 - p[0].dataIndex];
          return `<b>${item?.diagnostico}</b><br/>${this.tr(item?.des_diagn ?? '', 55)}<br/>Total: <b>${p[0].value}</b>`;
        },
      },
      grid: { left: 8, right: 55, bottom: 8, top: 8, containLabel: true },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: [...data].reverse().map((c: any) => c.diagnostico),
        axisLabel: { fontSize: 11, fontWeight: 600, color: '#475569' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 26,
          data: [...data].reverse().map((c: any) => c.total),
          itemStyle: { color: '#F59E0B', borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'right', fontSize: 11, color: '#334155' },
        },
      ],
    };
  }

  private buildTrazabilidadChart(sol: number, res: number): any {
    if (sol === 0) {
      return this.emptyChartConfig('No hay solicitudes');
    }

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 4, textStyle: { color: '#475569', fontSize: 12 } },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
          data: [
            { name: 'Con resultado', value: res, itemStyle: { color: '#10B981' } },
            {
              name: 'Sin resultado aún',
              value: Math.max(0, sol - res),
              itemStyle: { color: '#e2e8f0' },
            },
          ],
        },
      ],
    };
  }

  private buildNormalPatChart(data: any[]): any {
    const filtered = data.filter((x: any) => !['TOTAL', '', null].includes(x.resultado));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 4, textStyle: { color: '#475569', fontSize: 12 } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          label: { show: filtered.length > 0 },
          data:
            filtered.length > 0
              ? filtered.map((x: any) => ({
                  name: x.resultado,
                  value: x.total,
                  itemStyle: { color: x.resultado === 'NORMAL' ? '#10B981' : '#EF4444' },
                }))
              : [{ name: 'Sin clasificar', value: 1, itemStyle: { color: '#e2e8f0' } }],
        },
      ],
    };
  }

  private buildDiaSemanaChart(raw: any[]): any {
    if (this.isEmpty(raw)) {
      return this.emptyChartConfig('No hay datos por día');
    }

    const mapDias: Record<number, string> = {
      1: 'Dom',
      2: 'Lun',
      3: 'Mar',
      4: 'Mié',
      5: 'Jue',
      6: 'Vie',
      7: 'Sáb',
    };
    const dataObj: Record<string, number> = {
      Lun: 0,
      Mar: 0,
      Mié: 0,
      Jue: 0,
      Vie: 0,
      Sáb: 0,
      Dom: 0,
    };

    raw.forEach((item: any) => {
      if (mapDias[item.dia_semana]) dataObj[mapDias[item.dia_semana]] = item.total;
    });

    const orden = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 12, bottom: 8, top: 8, containLabel: true },
      xAxis: { type: 'category', data: orden, axisLabel: { fontSize: 11, color: '#475569' } },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          barMaxWidth: 30,
          data: orden.map((dia) => dataObj[dia]),
          itemStyle: { color: '#14B8A6', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', fontSize: 11, color: '#475569' },
        },
      ],
    };
  }

  private buildParetoChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay diagnósticos');
    }

    const totalGeneral = data.reduce((sum: number, item: any) => sum + item.total, 0);
    let acumulado = 0;
    const porcentajes = data.map((item: any) => {
      acumulado += item.total;
      return Number(((acumulado / totalGeneral) * 100).toFixed(1));
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: 8, right: 40, bottom: 8, top: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((c: any) => c.diagnostico),
        axisLabel: { fontSize: 10, color: '#475569', rotate: 25 },
      },
      yAxis: [
        { type: 'value', name: 'Volumen' },
        { type: 'value', name: '% Acumulado', min: 0, max: 100 },
      ],
      series: [
        {
          name: 'Volumen',
          type: 'bar',
          data: data.map((c: any) => c.total),
          itemStyle: { color: '#3B82F6' },
        },
        {
          name: '% Acumulado',
          type: 'line',
          yAxisIndex: 1,
          data: porcentajes,
          itemStyle: { color: '#EF4444' },
          lineStyle: { width: 3 },
        },
      ],
    };
  }

  private buildCurvaHorasChart(raw: any[]): any {
    const horasOrdenadas = [...(raw ?? [])].sort((a, b) =>
      a.horsolic > b.horsolic ? 1 : b.horsolic > a.horsolic ? -1 : 0,
    );

    if (this.isEmpty(horasOrdenadas)) {
      return this.emptyChartConfig('No hay datos por hora');
    }

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 15, bottom: 8, top: 15, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: horasOrdenadas.map((h: any) => h.horsolic),
        axisLabel: { fontSize: 10, color: '#475569' },
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Solicitudes',
          type: 'line',
          smooth: true,
          data: horasOrdenadas.map((h: any) => h.total),
          itemStyle: { color: '#F59E0B' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.5)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }

  private buildSegurosRoseChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de seguros');
    }

    return {
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
          data: data.map((s: any, i: number) => ({
            name: this.tr(s.tipo_seguro?.trim() ?? '', 15),
            value: s.total,
            itemStyle: { color: this.color(i) },
          })),
        },
      ],
    };
  }

  private buildSedesTreemapChart(data: any[]): any {
    if (this.isEmpty(data)) {
      return this.emptyChartConfig('No hay datos de sedes');
    }

    return {
      tooltip: { formatter: '{b}: <b>{c}</b> atenciones' },
      series: [
        {
          type: 'treemap',
          width: '100%',
          height: '100%',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
          data: data.map((s: any, i: number) => ({
            name: s.sede,
            value: s.total,
            itemStyle: { color: this.color(i) },
          })),
        },
      ],
    };
  }

  private buildGaugeChart(tasa: number, conResultado: number, total: number): any {
    return {
      series: [
        {
          type: 'gauge',
          center: ['50%', '58%'],
          radius: '88%',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 22,
              color: [
                [tasa / 100, '#10B981'],
                [1, '#f1f5f9'],
              ],
            },
          },
          pointer: { itemStyle: { color: '#10B981' } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { offsetCenter: ['0%', '32%'], fontSize: 11, color: '#94a3b8' },
          detail: {
            valueAnimation: true,
            fontSize: 30,
            fontWeight: 700,
            color: tasa >= 70 ? '#10B981' : tasa >= 40 ? '#F59E0B' : '#EF4444',
            formatter: '{value}%',
            offsetCenter: ['0%', '-8%'],
          },
          data: [{ value: Math.min(tasa, 100), name: `${conResultado} de ${total} con resultado` }],
        },
      ],
    };
  }

  private buildResultadoDonutChart(data: any[]): any {
    const filtered = data.filter((x: any) => !['TOTAL', '', null].includes(x.resultado));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 4, textStyle: { color: '#475569', fontSize: 12 } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          data:
            filtered.length > 0
              ? filtered.map((x: any) => ({
                  name: x.resultado,
                  value: x.total,
                  itemStyle: { color: x.resultado === 'NORMAL' ? '#10B981' : '#EF4444' },
                }))
              : [{ name: 'Sin clasificar', value: 1, itemStyle: { color: '#e2e8f0' } }],
        },
      ],
    };
  }

  private buildExamenResultadoChart(a: any, conResultado: number, total: number): any {
    const examTop = (a.top_examenes ?? []).slice(0, 6);
    const totalArea = total ?? 1;

    if (this.isEmpty(examTop)) {
      return this.emptyChartConfig('No hay exámenes en esta área');
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const items = params
            .map((p: any) => `${p.marker}${p.seriesName}: <b>${p.value}</b>`)
            .join('<br/>');
          return `${params[0]?.name}<br/>${items}`;
        },
      },
      legend: { bottom: 2, textStyle: { fontSize: 11, color: '#475569' } },
      grid: { left: 8, right: 8, bottom: 40, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: examTop.map((e: any) => this.trMed(e.desc_examen, 20)),
        axisLabel: { rotate: 25, fontSize: 10, color: '#475569' },
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Solicitados',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 40,
          data: examTop.map((e: any) => e.total),
          itemStyle: { color: '#1D6FD8' },
        },
        {
          name: 'Con resultado',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 40,
          data: examTop.map((e: any) =>
            Math.round(e.total * (conResultado / Math.max(totalArea, 1))),
          ),
          itemStyle: { color: '#10B981' },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#334155',
            formatter: (p: any) => (p.value > 0 ? p.value : ''),
          },
        },
      ],
    };
  }

  private buildRadarSemanalChart(raw: any[]): any {
    if (this.isEmpty(raw)) {
      return this.emptyChartConfig('No hay datos semanales');
    }

    const mapDias: Record<number, string> = {
      2: 'Lunes',
      3: 'Martes',
      4: 'Miércoles',
      5: 'Jueves',
      6: 'Viernes',
      7: 'Sábado',
      1: 'Domingo',
    };
    const dataObj: Record<string, number> = {
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
      Sábado: 0,
      Domingo: 0,
    };

    raw.forEach((item: any) => {
      if (mapDias[item.dia_semana]) dataObj[mapDias[item.dia_semana]] = item.total;
    });

    const maxVal = Math.max(...Object.values(dataObj), 10);

    return {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: [
          { name: 'Lun', max: maxVal },
          { name: 'Mar', max: maxVal },
          { name: 'Mié', max: maxVal },
          { name: 'Jue', max: maxVal },
          { name: 'Vie', max: maxVal },
          { name: 'Sáb', max: maxVal },
          { name: 'Dom', max: maxVal },
        ],
        axisName: { color: '#475569', fontWeight: 'bold' },
        splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9'] } },
      },
      series: [
        {
          name: 'Atenciones',
          type: 'radar',
          data: [
            {
              value: [
                dataObj['Lunes'],
                dataObj['Martes'],
                dataObj['Miércoles'],
                dataObj['Jueves'],
                dataObj['Viernes'],
                dataObj['Sábado'],
                dataObj['Domingo'],
              ],
              name: 'Volumen',
              areaStyle: { color: 'rgba(16, 185, 129, 0.4)' },
              lineStyle: { color: '#10B981', width: 2 },
              itemStyle: { color: '#10B981' },
            },
          ],
        },
      ],
    };
  }
}
