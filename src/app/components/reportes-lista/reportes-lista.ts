import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Device } from '../../services/device';
import { Reporte as ReporteSvc } from '../../services/reporte/reporte';
import { Reporte } from '../../interfaces/Reporte';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reportes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reportes-lista.html',
  styleUrl: './reportes-lista.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ReportesLista implements OnInit {
  private device = inject(Device);
  private svc = inject(ReporteSvc);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @Input() modo: 'publicos' | 'mis-reportes' = 'mis-reportes';

  isHandset$ = this.device.isHandset$;
  isTablet$ = this.device.isTablet$;
  isDesktop$ = this.device.isDesktop$;

  vistaActual: 'list' | 'grid' = 'list';
  busqueda = '';

  mostrarFiltros = false;
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroCreadoPor = '';
  ordenActual: 'nombre' | 'fecha_asc' | 'fecha_desc' = 'fecha_desc';

  reportesOriginales: Reporte[] = [];
  reportes: Reporte[] = [];

  cargandoReporte: number | null = null;
  cargandoPublicacion: number | null = null;

  get esPublico(): boolean {
    return this.modo === 'publicos';
  }

  ngOnInit() {
    this.obtenerReportes();
  }

  get tituloVista(): string {
    return this.esPublico ? 'Reportes Públicos' : 'Mis Reportes';
  }

  cambiarVista(vista: 'list' | 'grid') {
    this.vistaActual = vista;
  }

  obtenerReportes() {
    const source = this.esPublico
      ? this.svc.obtenerReportesPublicos()
      : this.svc.obtenerMisReportes();

    source.subscribe({
      next: (data: any[]) => {
        this.reportesOriginales = (data || []).map((r) => ({
          id: r.id,
          nombre: r.nombre || 'Sin nombre',
          creadoPor: r.autor?.nombre
            ? `${r.autor.nombre} ${r.autor.apellido || ''}`.trim()
            : 'Admin',
          periodo: r.fecha_actualizacion
            ? new Date(r.fecha_actualizacion).toLocaleDateString('es-PE', { month: 'long' })
            : 'N/A',
          actualizado: r.fecha_actualizacion
            ? new Date(r.fecha_actualizacion).toLocaleDateString()
            : 'N/A',
          descripcion: r.descripcion || 'Sin descripción',
          publicado: r.publicado ?? false,
          _fechaCreacion: r.fecha_creacion ? new Date(r.fecha_creacion) : new Date(),
        } as any));
        this.aplicarFiltros();
        this.cdr.markForCheck();
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar los reportes', 'error');
      },
    });
  }

  toggleFiltros() {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  abrirFiltros() {
    this.toggleFiltros();
  }

  aplicarFiltros() {
    let lista = [...this.reportesOriginales] as any[];

    const termino = this.busqueda.toLowerCase().trim();
    if (termino) {
      lista = lista.filter(
        (r) =>
          r.nombre.toLowerCase().includes(termino) ||
          r.creadoPor.toLowerCase().includes(termino) ||
          r.descripcion.toLowerCase().includes(termino) ||
          r.periodo.toLowerCase().includes(termino)
      );
    }

    if (this.filtroFechaDesde) {
      const desde = new Date(this.filtroFechaDesde);
      lista = lista.filter((r) => r._fechaCreacion >= desde);
    }

    if (this.filtroFechaHasta) {
      const hasta = new Date(this.filtroFechaHasta);
      hasta.setHours(23, 59, 59);
      lista = lista.filter((r) => r._fechaCreacion <= hasta);
    }

    if (this.filtroCreadoPor.trim()) {
      const creador = this.filtroCreadoPor.toLowerCase().trim();
      lista = lista.filter((r) => r.creadoPor.toLowerCase().includes(creador));
    }

    switch (this.ordenActual) {
      case 'nombre':
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'fecha_asc':
        lista.sort((a, b) => a._fechaCreacion - b._fechaCreacion);
        break;
      case 'fecha_desc':
      default:
        lista.sort((a, b) => b._fechaCreacion - a._fechaCreacion);
        break;
    }

    this.reportes = lista;
    this.cdr.markForCheck();
  }

  filtrarReportesPorNombre() {
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroCreadoPor = '';
    this.ordenActual = 'fecha_desc';
    this.aplicarFiltros();
  }

  get hayFiltrosActivos(): boolean {
    return !!(
      this.busqueda ||
      this.filtroFechaDesde ||
      this.filtroFechaHasta ||
      this.filtroCreadoPor
    );
  }

  verReporte(id: number) {
    if (this.cargandoReporte === id) return;
    this.cargandoReporte = id;
    this.cdr.markForCheck();

    const source = this.esPublico
      ? this.svc.obtenerReportePublicoPorId(id)
      : this.svc.obtenerReportePorId(id);

    source.subscribe({
      next: (reporte: any) => {
        this.cargandoReporte = null;
        this.cdr.markForCheck();
        sessionStorage.setItem('reporte_cargado', JSON.stringify(reporte));
        sessionStorage.setItem('reporte_publico', this.esPublico ? 'true' : 'false');
        this.router.navigate(['principal/reportes/dashboard'], {
          state: { reporteId: id, fromSaved: true, esPublico: this.esPublico },
        });
      },
      error: () => {
        this.cargandoReporte = null;
        this.cdr.markForCheck();
        Swal.fire('Error', 'No se pudo cargar el reporte. Intenta nuevamente.', 'error');
      },
    });
  }

  eliminarReporte(id: number, event: Event) {
    if (this.esPublico) return;
    event.stopPropagation();
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto. El reporte se eliminará permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.svc.eliminarReporte(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El reporte ha sido eliminado.', 'success');
            this.obtenerReportes();
          },
          error: () => {
            Swal.fire('Error', 'Hubo un problema al eliminar el reporte.', 'error');
          },
        });
      }
    });
  }

  togglePublicar(id: number, event: Event) {
    if (this.esPublico) return;
    event.stopPropagation();
    this.cargandoPublicacion = id;
    this.cdr.markForCheck();

    this.svc.publicarReporte(id).subscribe({
      next: (res: any) => {
        this.cargandoPublicacion = null;
        const reporte = this.reportesOriginales.find((r) => r.id === id);
        if (reporte) {
          reporte.publicado = res.publicado ?? !reporte.publicado;
        }
        this.aplicarFiltros();
        this.cdr.markForCheck();
        const estado = reporte?.publicado ? 'publicado' : 'despublicado';
        Swal.fire('Listo', `El reporte se ha ${estado} correctamente`, 'success');
      },
      error: () => {
        this.cargandoPublicacion = null;
        this.cdr.markForCheck();
        Swal.fire('Error', 'No se pudo cambiar el estado de publicación', 'error');
      },
    });
  }

  exportarPagina() {
    const doc = new jsPDF('l', 'mm', 'a4');
    const margin = 14;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Reportes', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const fechaStr = now.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Fecha de impresión: ${fechaStr}`, margin, 28);

    const rows = (this.reportes || []).map((r: any) => [
      r.nombre,
      r.creadoPor,
      r.periodo,
      r.actualizado,
      r.descripcion
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['Nombre', 'Creado por', 'Periodo', 'Actualizado', 'Descripción']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 'auto' },
      },
      didDrawPage: () => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Página ${pageCount}`,
          margin,
          doc.internal.pageSize.getHeight() - 10
        );
      },
    });

    doc.save(`reportes_${now.toISOString().slice(0, 10)}.pdf`);
  }

  async exportarPDF() {
    const loading = Swal.fire({
      title: 'Generando PDF...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const element = document.querySelector('.reportes-exportable') as HTMLElement;
      if (!element) {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el PDF', 'error');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const titulo = this.tituloVista.replace(/\s+/g, '_').toLowerCase();
      pdf.save(`${titulo}_${new Date().toISOString().slice(0, 10)}.pdf`);
      Swal.close();
    } catch (e) {
      Swal.close();
      Swal.fire('Error', 'Ocurrió un error al generar el PDF', 'error');
    }
  }
}
